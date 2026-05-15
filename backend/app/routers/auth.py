from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from jose import jwt
from passlib.context import CryptContext

from app.config import get_settings
from app.database import get_supabase_admin
from app.middleware.auth import get_current_user
from app.schemas.auth import TokenResponse, UserLogin, UserRegister, UserResponse

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
auth_router = APIRouter(prefix="/auth", tags=["auth"])


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)


@auth_router.post("/register", response_model=TokenResponse)
async def register(user: UserRegister):
    supabase = get_supabase_admin()

    existing = supabase.table("users").select("*").eq("email", user.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")

    password_hash = pwd_context.hash(user.password)

    result = (
        supabase.table("users")
        .insert(
            {
                "email": user.email,
                "password_hash": password_hash,
                "full_name": user.full_name,
                "preferences": {},
                "is_onboarding_complete": False,
            }
        )
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create user")

    user_data = result.data[0]
    access_token = create_access_token({"sub": user_data["id"]})

    return TokenResponse(
        access_token=access_token,
        user={
            "id": user_data["id"],
            "email": user_data["email"],
            "full_name": user_data["full_name"],
            "preferences": user_data.get("preferences", {}),
            "is_onboarding_complete": user_data.get("is_onboarding_complete", False),
        },
    )


@auth_router.post("/login", response_model=TokenResponse)
async def login(user: UserLogin):
    supabase = get_supabase_admin()

    result = supabase.table("users").select("*").eq("email", user.email).execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user_data = result.data[0]

    if not pwd_context.verify(user.password, user_data["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token({"sub": user_data["id"]})

    return TokenResponse(
        access_token=access_token,
        user={
            "id": user_data["id"],
            "email": user_data["email"],
            "full_name": user_data["full_name"],
            "avatar_url": user_data.get("avatar_url"),
            "preferences": user_data.get("preferences", {}),
            "is_onboarding_complete": user_data.get("is_onboarding_complete", False),
        },
    )


@auth_router.post("/logout")
async def logout():
    return {"message": "Logged out successfully"}


@auth_router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_admin()
    result = (
        supabase.table("users").select("*").eq("id", current_user["user_id"]).execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")

    return result.data[0]
