from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from app.middleware.auth import get_current_user
from app.database import get_supabase_admin

sessions_router = APIRouter(prefix="/sessions", tags=["sessions"])

@sessions_router.get("/upcoming")
async def get_upcoming_sessions(
    limit: int = Query(default=5, le=20),
    current_user: dict = Depends(get_current_user)
):
    supabase = get_supabase_admin()

    memberships = supabase.table("group_members").select("group_id").eq("user_id", current_user["user_id"]).eq("status", "accepted").execute()

    if not memberships.data:
        return {"sessions": []}

    group_ids = [m["group_id"] for m in memberships.data]
    result = supabase.table("sessions").select("*").in_("group_id", group_ids).eq("status", "scheduled").order("scheduled_at").limit(limit).execute()

    sessions_with_groups = []
    for session in result.data:
        group = supabase.table("groups").select("name").eq("id", session["group_id"]).execute()
        sessions_with_groups.append({
            **session,
            "group_name": group.data[0]["name"] if group.data else "Unknown Group"
        })

    return {"sessions": sessions_with_groups}

@sessions_router.get("/")
async def list_sessions(
    group_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(default=20, le=100),
    current_user: dict = Depends(get_current_user)
):
    supabase = get_supabase_admin()

    query = supabase.table("sessions").select("*")

    if group_id:
        query = query.eq("group_id", group_id)
    if status:
        query = query.eq("status", status)

    result = query.limit(limit).order("scheduled_at").execute()

    return {"sessions": result.data}

@sessions_router.post("/")
async def create_session(
    session_data: dict,
    current_user: dict = Depends(get_current_user)
):
    supabase = get_supabase_admin()

    membership = supabase.table("group_members").select("*").eq("group_id", session_data["group_id"]).eq("user_id", current_user["user_id"]).eq("status", "accepted").execute()

    if not membership.data:
        raise HTTPException(status_code=403, detail="Must be a group member to create sessions")

    result = supabase.table("sessions").insert(session_data).execute()

    return result.data[0] if result.data else None

@sessions_router.get("/{session_id}")
async def get_session(session_id: str, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_admin()
    result = supabase.table("sessions").select("*").eq("id", session_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Session not found")

    return result.data[0]

@sessions_router.patch("/{session_id}")
async def update_session(
    session_id: str,
    update_data: dict,
    current_user: dict = Depends(get_current_user)
):
    supabase = get_supabase_admin()

    session = supabase.table("sessions").select("*").eq("id", session_id).execute()
    if not session.data:
        raise HTTPException(status_code=404, detail="Session not found")

    membership = supabase.table("group_members").select("*").eq("group_id", session.data[0]["group_id"]).eq("user_id", current_user["user_id"]).eq("status", "accepted").execute()

    if not membership.data:
        raise HTTPException(status_code=403, detail="Must be a group member")

    result = supabase.table("sessions").update(update_data).eq("id", session_id).execute()

    return result.data[0] if result.data else None

@sessions_router.delete("/{session_id}")
async def cancel_session(session_id: str, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_admin()

    session = supabase.table("sessions").select("*").eq("id", session_id).execute()
    if not session.data:
        raise HTTPException(status_code=404, detail="Session not found")

    membership = supabase.table("group_members").select("*").eq("group_id", session.data[0]["group_id"]).eq("user_id", current_user["user_id"]).eq("status", "accepted").execute()

    if not membership.data:
        raise HTTPException(status_code=403, detail="Must be a group member")

    supabase.table("sessions").update({"status": "cancelled"}).eq("id", session_id).execute()

    return {"message": "Session cancelled"}

@sessions_router.patch("/{session_id}/complete")
async def complete_session(session_id: str, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_admin()

    result = supabase.table("sessions").update({"status": "completed"}).eq("id", session_id).execute()

    return result.data[0] if result.data else None
