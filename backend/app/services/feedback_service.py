# backend/app/services/feedback_service.py
from app.database import get_supabase_admin
import logging

logger = logging.getLogger(__name__)


def record_feedback(user_id: str, group_id: str, feedback: dict) -> dict:
    """Store feedback for future matching."""
    supabase = get_supabase_admin()

    result = supabase.table("feedback").insert({
        "user_id": user_id,
        "group_id": group_id,
        "rating": feedback.get("rating"),
        "what_worked": feedback.get("what_worked"),
        "what_could_improve": feedback.get("what_could_improve"),
        "is_submitted": True
    }).execute()

    logger.info(f"Recorded feedback for user {user_id} in group {group_id}")
    return result.data[0] if result.data else {}


def get_relevant_feedback(user_prefs: dict, limit: int = 10) -> list[dict]:
    """Find successful matches with similar preferences."""
    supabase = get_supabase_admin()

    # Get feedback with high ratings (4-5) for matching subjects
    result = supabase.table("feedback").select("*").gte("rating", 4).limit(limit).execute()

    logger.info(f"Found {len(result.data)} relevant feedback entries")
    return result.data or []