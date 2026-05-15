from fastapi import APIRouter, HTTPException, Depends
from app.middleware.auth import get_current_user
from app.database import get_supabase_admin

notifications_router = APIRouter(prefix="/notifications", tags=["notifications"])

@notifications_router.get("/")
async def list_notifications(current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_admin()

    result = supabase.table("notifications").select("*").eq("user_id", current_user["user_id"]).order("created_at", desc=True).limit(50).execute()

    return {"notifications": result.data}

@notifications_router.patch("/{notification_id}/read")
async def mark_as_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_admin()

    notif = supabase.table("notifications").select("*").eq("id", notification_id).eq("user_id", current_user["user_id"]).execute()

    if not notif.data:
        raise HTTPException(status_code=404, detail="Notification not found")

    result = supabase.table("notifications").update({"is_read": True}).eq("id", notification_id).execute()

    return result.data[0] if result.data else None

@notifications_router.patch("/read-all")
async def mark_all_as_read(current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_admin()

    supabase.table("notifications").update({"is_read": True}).eq("user_id", current_user["user_id"]).execute()

    return {"message": "All notifications marked as read"}
