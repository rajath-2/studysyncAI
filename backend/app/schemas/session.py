from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SessionCreate(BaseModel):
    group_id: str
    scheduled_at: datetime
    duration_minutes: int = 60
    meeting_link: Optional[str] = None

class SessionUpdate(BaseModel):
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    meeting_link: Optional[str] = None
    status: Optional[str] = None

class SessionResponse(BaseModel):
    id: str
    group_id: str
    scheduled_at: datetime
    duration_minutes: int
    meeting_link: Optional[str] = None
    status: str
    created_at: datetime
