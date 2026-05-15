from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from app.middleware.auth import get_current_user
from app.database import get_supabase_admin
from app.services.compatibility_service import calculate_math_score

groups_router = APIRouter(prefix="/groups", tags=["groups"])

@groups_router.get("/my")
async def get_my_groups(current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_admin()

    memberships = supabase.table("group_members").select("group_id", "role").eq("user_id", current_user["user_id"]).eq("status", "accepted").execute()

    if not memberships.data:
        return {"groups": []}

    group_ids = [m["group_id"] for m in memberships.data]
    result = supabase.table("groups").select("*").in_("id", group_ids).eq("status", "active").execute()

    groups = result.data
    for group in groups:
        members = supabase.table("group_members").select("id").eq("group_id", group["id"]).eq("status", "accepted").execute()
        group["member_count"] = len(members.data)
        for m in memberships.data:
            if m["group_id"] == group["id"]:
                group["your_role"] = m["role"]
                break

    return {"groups": groups}

@groups_router.get("/")
async def list_groups(
    subject: Optional[str] = None,
    status: Optional[str] = "active",
    limit: int = Query(default=20, le=100),
    offset: int = 0,
    current_user: dict = Depends(get_current_user)
):
    supabase = get_supabase_admin()

    query = supabase.table("groups").select("*")

    if subject:
        query = query.eq("subject", subject)
    if status:
        query = query.eq("status", status)

    result = query.range(offset, offset + limit - 1).execute()

    groups = result.data
    for group in groups:
        members = supabase.table("group_members").select("id").eq("group_id", group["id"]).eq("status", "accepted").execute()
        group["member_count"] = len(members.data)

    return {"groups": groups, "total": len(groups)}

@groups_router.post("/")
async def create_group(
    group_data: dict,
    current_user: dict = Depends(get_current_user)
):
    supabase = get_supabase_admin()

    # Add default values for new fields
    group_data["created_by"] = current_user["user_id"]
    group_data["status"] = "active"
    group_data.setdefault("study_format", "virtual")
    group_data.setdefault("session_timing", [])
    group_data.setdefault("meeting_frequency", 1)

    result = supabase.table("groups").insert(group_data).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create group")

    group = result.data[0]

    supabase.table("group_members").insert({
        "group_id": group["id"],
        "user_id": current_user["user_id"],
        "role": "admin",
        "status": "accepted"
    }).execute()

    return group

@groups_router.get("/discover")
async def discover_groups(current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_admin()

    # Get user's groups
    memberships = supabase.table("group_members").select("group_id").eq("user_id", current_user["user_id"]).eq("status", "accepted").execute()
    my_group_ids = [m["group_id"] for m in memberships.data] if memberships.data else []

    # Get all active groups not in user's groups
    query = supabase.table("groups").select("*").eq("status", "active")
    if my_group_ids:
        query = query.not_.in_("id", my_group_ids)

    result = query.execute()

    # Get user preferences
    user_result = supabase.table("users").select("preferences").eq("id", current_user["user_id"]).execute()
    user_prefs = user_result.data[0]["preferences"] if user_result.data else {}

    # Calculate compatibility for each group
    groups_with_scores = []
    for group in result.data:
        # Get member preferences
        members = supabase.table("group_members").select("user_id").eq("group_id", group["id"]).eq("status", "accepted").execute()
        member_prefs = []
        for m in members.data:
            member_user = supabase.table("users").select("preferences").eq("id", m["user_id"]).execute()
            if member_user.data:
                member_prefs.append(member_user.data[0]["preferences"])

        score_result = calculate_math_score(user_prefs, group, member_prefs)
        group["compatibility_score"] = score_result["score"]
        group["member_count"] = len(members.data)
        groups_with_scores.append(group)

    # Sort by compatibility
    groups_with_scores.sort(key=lambda g: g.get("compatibility_score", 0), reverse=True)

    return {"groups": groups_with_scores}

@groups_router.get("/compatibility/{group_id}")
async def get_compatibility(
    group_id: str,
    current_user: dict = Depends(get_current_user)
):
    supabase = get_supabase_admin()

    # Get group
    group = supabase.table("groups").select("*").eq("id", group_id).execute()
    if not group.data:
        raise HTTPException(status_code=404, detail="Group not found")

    # Get user preferences
    user_result = supabase.table("users").select("preferences").eq("id", current_user["user_id"]).execute()
    user_prefs = user_result.data[0]["preferences"] if user_result.data else {}

    # Get member preferences
    members = supabase.table("group_members").select("user_id").eq("group_id", group_id).eq("status", "accepted").execute()
    member_prefs = []
    for m in members.data:
        if m["user_id"] != current_user["user_id"]:
            member_user = supabase.table("users").select("preferences").eq("id", m["user_id"]).execute()
            if member_user.data:
                member_prefs.append(member_user.data[0]["preferences"])

    result = calculate_math_score(user_prefs, group.data[0], member_prefs)

    return result

@groups_router.get("/{group_id}")
async def get_group(group_id: str, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_admin()
    result = supabase.table("groups").select("*").eq("id", group_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Group not found")

    return result.data[0]

@groups_router.patch("/{group_id}")
async def update_group(
    group_id: str,
    update_data: dict,
    current_user: dict = Depends(get_current_user)
):
    supabase = get_supabase_admin()

    membership = supabase.table("group_members").select("*").eq("group_id", group_id).eq("user_id", current_user["user_id"]).eq("role", "admin").execute()

    if not membership.data:
        raise HTTPException(status_code=403, detail="Only admins can update group")

    update_data["updated_at"] = "now()"
    result = supabase.table("groups").update(update_data).eq("id", group_id).execute()

    return result.data[0] if result.data else None

@groups_router.delete("/{group_id}")
async def delete_group(group_id: str, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_admin()

    membership = supabase.table("group_members").select("*").eq("group_id", group_id).eq("user_id", current_user["user_id"]).eq("role", "admin").execute()

    if not membership.data:
        raise HTTPException(status_code=403, detail="Only admins can delete group")

    supabase.table("groups").delete().eq("id", group_id).execute()

    return {"message": "Group deleted"}

@groups_router.get("/{group_id}/members")
async def get_group_members(group_id: str, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_admin()

    result = supabase.table("group_members").select("*").eq("group_id", group_id).eq("status", "accepted").execute()

    members = []
    for member in result.data:
        user = supabase.table("users").select("email", "full_name").eq("id", member["user_id"]).execute()
        if user.data:
            members.append({
                **member,
                "user_email": user.data[0]["email"],
                "user_name": user.data[0]["full_name"]
            })

    return {"members": members}

@groups_router.get("/{group_id}/pending-requests")
async def get_pending_requests(
    group_id: str,
    current_user: dict = Depends(get_current_user)
):
    supabase = get_supabase_admin()

    # Check if user is admin
    membership = supabase.table("group_members").select("*").eq("group_id", group_id).eq("user_id", current_user["user_id"]).eq("role", "admin").execute()
    if not membership.data:
        raise HTTPException(status_code=403, detail="Only admins can view requests")

    # Get pending requests
    requests = supabase.table("group_members").select("*").eq("group_id", group_id).eq("status", "pending").execute()

    result_requests = []
    for req in requests.data:
        user = supabase.table("users").select("email", "full_name", "preferences").eq("id", req["user_id"]).execute()
        if user.data:
            # Calculate compatibility
            user_prefs = user.data[0]["preferences"]
            group = supabase.table("groups").select("*").eq("id", group_id).execute().data[0]
            members = supabase.table("group_members").select("user_id").eq("group_id", group_id).eq("status", "accepted").execute()
            member_prefs = []
            for m in members.data:
                if m["user_id"] != req["user_id"]:
                    member_user = supabase.table("users").select("preferences").eq("id", m["user_id"]).execute()
                    if member_user.data:
                        member_prefs.append(member_user.data[0]["preferences"])

            score_result = calculate_math_score(user_prefs, group, member_prefs)

            result_requests.append({
                "id": req["id"],
                "user_id": req["user_id"],
                "user_name": user.data[0]["full_name"],
                "user_email": user.data[0]["email"],
                "compatibility_score": score_result["score"],
                "join_message": req.get("join_message", ""),
                "preferences_snapshot": req.get("preferences_snapshot", {}),
                "requested_at": req["joined_at"]
            })

    return {"requests": result_requests}

@groups_router.post("/{group_id}/join")
async def join_group(
    group_id: str,
    join_data: dict = {},
    current_user: dict = Depends(get_current_user)
):
    supabase = get_supabase_admin()

    group = supabase.table("groups").select("*").eq("id", group_id).execute()
    if not group.data:
        raise HTTPException(status_code=404, detail="Group not found")

    members = supabase.table("group_members").select("id").eq("group_id", group_id).eq("status", "accepted").execute()
    member_count = len(members.data)

    if member_count >= group.data[0]["max_members"]:
        raise HTTPException(status_code=400, detail="Group is full")

    existing = supabase.table("group_members").select("*").eq("group_id", group_id).eq("user_id", current_user["user_id"]).execute()
    if existing.data:
        if existing.data[0]["status"] == "accepted":
            raise HTTPException(status_code=400, detail="Already a member")
        else:
            raise HTTPException(status_code=400, detail="Already a member or pending")

    # Get user preferences for snapshot
    user_result = supabase.table("users").select("preferences").eq("id", current_user["user_id"]).execute()
    user_prefs = user_result.data[0]["preferences"] if user_result.data else {}

    supabase.table("group_members").insert({
        "group_id": group_id,
        "user_id": current_user["user_id"],
        "role": "member",
        "status": "pending",
        "join_message": join_data.get("message", ""),
        "preferences_snapshot": user_prefs
    }).execute()

    return {"message": "Join request sent", "status": "pending"}

@groups_router.post("/{group_id}/leave")
async def leave_group(group_id: str, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_admin()

    supabase.table("group_members").delete().eq("group_id", group_id).eq("user_id", current_user["user_id"]).execute()

    return {"message": "Left group"}

@groups_router.post("/{group_id}/accept/{user_id}")
async def accept_member(
    group_id: str,
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    supabase = get_supabase_admin()

    membership = supabase.table("group_members").select("*").eq("group_id", group_id).eq("user_id", current_user["user_id"]).eq("role", "admin").execute()

    if not membership.data:
        raise HTTPException(status_code=403, detail="Only admins can accept members")

    result = supabase.table("group_members").update({"status": "accepted"}).eq("group_id", group_id).eq("user_id", user_id).execute()

    # Create notification
    group = supabase.table("groups").select("name").eq("id", group_id).execute().data[0]
    supabase.table("notifications").insert({
        "user_id": user_id,
        "type": "join_request_accepted",
        "title": f"You joined {group['name']}!",
        "message": "Your request was accepted. Welcome to the group!",
        "data": {"group_id": group_id}
    }).execute()

    return result.data[0] if result.data else None

@groups_router.delete("/{group_id}/requests/{user_id}")
async def reject_request(
    group_id: str,
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    supabase = get_supabase_admin()

    # Check admin
    membership = supabase.table("group_members").select("*").eq("group_id", group_id).eq("user_id", current_user["user_id"]).eq("role", "admin").execute()
    if not membership.data:
        raise HTTPException(status_code=403, detail="Only admins can reject requests")

    # Delete the pending request
    supabase.table("group_members").delete().eq("group_id", group_id).eq("user_id", user_id).eq("status", "pending").execute()

    return {"message": "Request rejected"}

@groups_router.post("/{group_id}/reject/{user_id}")
async def reject_member(
    group_id: str,
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    supabase = get_supabase_admin()

    membership = supabase.table("group_members").select("*").eq("group_id", group_id).eq("user_id", current_user["user_id"]).eq("role", "admin").execute()

    if not membership.data:
        raise HTTPException(status_code=403, detail="Only admins can reject members")

    supabase.table("group_members").delete().eq("group_id", group_id).eq("user_id", user_id).execute()

    return {"message": "Member rejected"}

@groups_router.patch("/{group_id}/close")
async def close_group(group_id: str, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_admin()

    membership = supabase.table("group_members").select("*").eq("group_id", group_id).eq("user_id", current_user["user_id"]).eq("role", "admin").execute()

    if not membership.data:
        raise HTTPException(status_code=403, detail="Only admins can close group")

    result = supabase.table("groups").update({"status": "closed", "updated_at": "now()"}).eq("id", group_id).execute()

    return result.data[0] if result.data else None