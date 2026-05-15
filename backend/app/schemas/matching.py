from pydantic import BaseModel
from typing import Optional

class MatchingRequest(BaseModel):
    user_id: str

class RecommendationResponse(BaseModel):
    group_id: str
    match_score: int
    reasoning: str
    suggested_improvements: Optional[str] = None

class MatchingResponse(BaseModel):
    recommendations: list[RecommendationResponse]
