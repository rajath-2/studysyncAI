from fastapi import APIRouter, HTTPException, Depends
from app.middleware.auth import get_current_user
from app.database import get_supabase_admin

feedback_router = APIRouter(prefix="/feedback", tags=["feedback"])

@feedback_router.post("/")
async def submit_feedback(
    feedback_data: dict,
    current_user: dict = Depends(get_current_user)
):
    supabase = get_supabase_admin()
    user_id = current_user["user_id"]

    # Verify user was member of group
    membership = supabase.table("group_members").select("*").eq("group_id", feedback_data["group_id"]).eq("user_id", user_id).eq("status", "accepted").execute()

    if not membership.data:
        raise HTTPException(status_code=403, detail="Must be a group member to submit feedback")

    feedback_data["user_id"] = user_id
    feedback_data["is_submitted"] = True

    result = supabase.table("feedback").insert(feedback_data).execute()

    return result.data[0] if result.data else None

@feedback_router.get("/{group_id}")
async def get_group_feedback(
    group_id: str,
    current_user: dict = Depends(get_current_user)
):
    supabase = get_supabase_admin()

    # Verify user is member
    membership = supabase.table("group_members").select("*").eq("group_id", group_id).eq("user_id", current_user["user_id"]).eq("status", "accepted").execute()

    if not membership.data:
        raise HTTPException(status_code=403, detail="Must be a group member")

    result = supabase.table("feedback").select("*").eq("group_id", group_id).eq("is_submitted", True).execute()

    return {"feedback": result.data}

@feedback_router.get("/user/history")
async def get_user_feedback_history(current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_admin()

    result = supabase.table("feedback").select("*").eq("user_id", current_user["user_id"]).eq("is_submitted", True).order("created_at", desc=True).execute()

    return {"feedback": result.data}

@feedback_router.get("/{group_id}/summary")
async def get_feedback_summary(group_id: str, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_admin()

    result = supabase.table("feedback").select("rating").eq("group_id", group_id).eq("is_submitted", True).execute()

    if not result.data:
        return {"average_rating": 0, "count": 0}

    ratings = [f["rating"] for f in result.data if f.get("rating")]
    avg = sum(ratings) / len(ratings) if ratings else 0

    return {
        "average_rating": round(avg, 1),
        "count": len(ratings)
    }