from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MessageCreate(BaseModel):
    content: str

class MessageResponse(BaseModel):
    id: str
    group_id: str
    user_id: Optional[str] = None
    content: str
    created_at: datetime
    user_name: Optional[str] = None
    user_avatar: Optional[str] = None
