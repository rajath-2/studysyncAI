from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from app.middleware.auth import get_current_user
from app.database import get_supabase_admin

messages_router = APIRouter(prefix="/messages", tags=["messages"])

@messages_router.get("/{group_id}")
async def get_messages(
    group_id: str,
    limit: int = Query(default=50, le=100),
    before: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    supabase = get_supabase_admin()

    membership = supabase.table("group_members").select("*").eq("group_id", group_id).eq("user_id", current_user["user_id"]).eq("status", "accepted").execute()

    if not membership.data:
        raise HTTPException(status_code=403, detail="Must be a group member to view messages")

    query = supabase.table("messages").select("*").eq("group_id", group_id)

    if before:
        query = query.lt("created_at", before)

    result = query.order("created_at", desc=True).limit(limit).execute()

    messages = []
    for msg in result.data:
        user = supabase.table("users").select("full_name", "avatar_url").eq("id", msg["user_id"]).execute()
        msg["user_name"] = user.data[0]["full_name"] if user.data else "Unknown"
        msg["user_avatar"] = user.data[0].get("avatar_url") if user.data else None
        messages.append(msg)

    return {"messages": messages}

@messages_router.post("/{group_id}")
async def send_message(
    group_id: str,
    message_data: dict,
    current_user: dict = Depends(get_current_user)
):
    supabase = get_supabase_admin()

    membership = supabase.table("group_members").select("*").eq("group_id", group_id).eq("user_id", current_user["user_id"]).eq("status", "accepted").execute()

    if not membership.data:
        raise HTTPException(status_code=403, detail="Must be a group member to send messages")

    message_data["group_id"] = group_id
    message_data["user_id"] = current_user["user_id"]

    result = supabase.table("messages").insert(message_data).execute()

    return result.data[0] if result.data else None
