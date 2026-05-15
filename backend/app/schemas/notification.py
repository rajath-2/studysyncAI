from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    message: Optional[str] = None
    is_read: bool
    data: dict = {}
    created_at: datetime
