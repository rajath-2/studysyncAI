from pydantic import BaseModel
from typing import Optional

class FeedbackCreate(BaseModel):
    group_id: str
    session_id: Optional[str] = None
    rating: int  # 1-5
    what_worked: Optional[str] = None
    what_could_improve: Optional[str] = None

class FeedbackResponse(BaseModel):
    id: str
    group_id: str
    user_id: str
    rating: int
    what_worked: Optional[str] = None
    what_could_improve: Optional[str] = None
    is_submitted: bool
    created_at: str