from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class GroupCreate(BaseModel):
    name: str
    subject: str
    description: Optional[str] = None
    max_members: int = 6
    goal: Optional[str] = None
    goal_deadline: Optional[datetime] = None

class GroupUpdate(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    description: Optional[str] = None
    max_members: Optional[int] = None
    goal: Optional[str] = None
    goal_deadline: Optional[datetime] = None
    status: Optional[str] = None

class GroupResponse(BaseModel):
    id: str
    name: str
    subject: str
    description: Optional[str] = None
    max_members: int
    goal: Optional[str] = None
    goal_deadline: Optional[datetime] = None
    status: str
    created_by: str
    member_count: int = 0
    created_at: datetime

class MemberResponse(BaseModel):
    id: str
    user_id: str
    role: str
    status: str
    joined_at: datetime
    user_email: str
    user_name: str
