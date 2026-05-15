from fastapi import APIRouter, HTTPException, Depends
from app.middleware.auth import get_current_user
from app.database import get_supabase_admin

users_router = APIRouter(prefix="/users", tags=["users"])

@users_router.get("/{user_id}")
async def get_user(user_id: str, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_admin()
    result = supabase.table("users").select("*").eq("id", user_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")

    return result.data[0]

@users_router.patch("/{user_id}")
async def update_user(
    user_id: str,
    update_data: dict,
    current_user: dict = Depends(get_current_user)
):
    if current_user["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this user")

    supabase = get_supabase_admin()
    update_data["updated_at"] = "now()"

    result = supabase.table("users").update(update_data).eq("id", user_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")

    return result.data[0]

@users_router.get("/{user_id}/preferences")
async def get_preferences(user_id: str, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_admin()
    result = supabase.table("users").select("preferences").eq("id", user_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")

    return result.data[0].get("preferences", {})

@users_router.patch("/{user_id}/preferences")
async def update_preferences(
    user_id: str,
    preferences: dict,
    current_user: dict = Depends(get_current_user)
):
    if current_user["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this user")

    supabase = get_supabase_admin()

    result = supabase.table("users").update({
        "preferences": preferences,
        "is_onboarding_complete": True,
        "updated_at": "now()"
    }).eq("id", user_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")

    return result.data[0].get("preferences", {})