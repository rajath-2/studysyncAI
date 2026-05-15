# backend/tests/test_feedback_service.py
import pytest
from app.services.feedback_service import record_feedback, get_relevant_feedback

def test_record_feedback():
    feedback = {"rating": 5, "what_worked": "Great group"}
    result = record_feedback("user-1", "group-1", feedback)
    assert result is not None

def test_get_relevant_feedback():
    user_prefs = {"subjects": [{"name": "Mathematics"}], "learning_style": "visual"}
    result = get_relevant_feedback(user_prefs, limit=5)
    assert isinstance(result, list)