from pydantic import BaseModel
from typing import Optional

class PreferencesUpdate(BaseModel):
    priorities: list[str] = []
    hours: list[str] = []
    subjects: list[str] = []

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    university: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    university: Optional[str] = None
    preferences: dict = {}
    is_onboarding_complete: bool = False