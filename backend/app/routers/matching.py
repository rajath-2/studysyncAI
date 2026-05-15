import logging
from fastapi import APIRouter, HTTPException, Depends
from app.middleware.auth import get_current_user
from app.database import get_supabase_admin
from app.services.matching_service import matching_service
from app.services.rate_limiter import rate_limiter_matching

logger = logging.getLogger(__name__)

matching_router = APIRouter(prefix="/matching", tags=["matching"])

@matching_router.post("/recommend")
async def get_recommendations(
    current_user: dict = Depends(get_current_user)
):
    logger.info(f"=== MATCHING REQUEST for user: {current_user['user_id']} ===")

    rate_limiter_matching.check(current_user["user_id"])
    logger.info("Rate limit check passed")

    supabase = get_supabase_admin()
    user_id = current_user["user_id"]

    # Get user with preferences
    user = supabase.table("users").select("*").eq("id", user_id).execute()
    if not user.data:
        raise HTTPException(status_code=404, detail="User not found")

    preferences = user.data[0].get("preferences", {})
    logger.info(f"User preferences retrieved: {preferences}")

    # Get relevant feedback from pgvector (simplified - would use actual vector search)
    feedback_result = supabase.table("feedback").select("*").eq("rating", 4).eq("is_submitted", True).limit(10).execute()
    relevant_feedback = [
        {
            "rating": f.get("rating"),
            "what_worked": f.get("what_worked"),
            "group_subject": "Math"  # Would be joined from groups table
        }
        for f in feedback_result.data
    ]
    logger.info(f"Retrieved {len(relevant_feedback)} positive feedback entries")

    # Get user's groups to exclude from recommendations
    user_memberships = supabase.table("group_members").select("group_id").eq("user_id", user_id).eq("status", "accepted").execute()
    joined_group_ids = [m["group_id"] for m in user_memberships.data] if user_memberships.data else []

    # Get available groups (exclude groups user is already in)
    groups_query = supabase.table("groups").select("*").eq("status", "active")
    if joined_group_ids:
        groups_query = groups_query.not_.in_("id", joined_group_ids)
    groups = groups_query.limit(20).execute()

    available_groups = [
        {
            "id": g["id"],
            "name": g["name"],
            "subject": g["subject"],
            "max_members": g["max_members"],
            "goal": g.get("goal")
        }
        for g in groups.data
    ]
    logger.info(f"Found {len(available_groups)} active groups (excluded {len(joined_group_ids)} already joined)")

    # Get recommendations from Groq
    logger.info("Calling matching service...")
    recommendations = await matching_service.get_recommendations(
        student_preferences=preferences,
        relevant_feedback=relevant_feedback,
        available_groups=available_groups
    )
    logger.info(f"Matching complete, returning {len(recommendations)} recommendations")

    return {"recommendations": recommendations}

@matching_router.post("/suggest-merge")
async def suggest_merge(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    supabase = get_supabase_admin()

    source_id = request.get("source_group_id")
    target_id = request.get("target_group_id")

    if not source_id or not target_id:
        raise HTTPException(status_code=400, detail="Both group IDs required")

    # Verify user is admin of source group
    membership = supabase.table("group_members").select("*").eq("group_id", source_id).eq("user_id", current_user["user_id"]).eq("role", "admin").execute()

    if not membership.data:
        raise HTTPException(status_code=403, detail="Must be admin of source group")

    return {
        "suggestion": "merge",
        "source_group_id": source_id,
        "target_group_id": target_id,
        "message": "Merge suggestion logged"
    }

@matching_router.post("/regenerate")
async def regenerate_recommendations(
    current_user: dict = Depends(get_current_user)
):
    """Regenerate recommendations after user updates preferences."""
    # Same logic as existing /recommend
    return await get_recommendations(current_user)
