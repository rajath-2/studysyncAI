# backend/tests/test_compatibility_service.py
import pytest
from app.services.compatibility_service import calculate_math_score, calculate_member_alignment

def test_subject_match_full_score():
    user_prefs = {"subjects": [{"name": "Mathematics", "level": "intermediate"}]}
    group = {"subject": "Mathematics"}
    result = calculate_math_score(user_prefs, group, [])
    assert result["score"] >= 40

def test_subject_mismatch_zero():
    user_prefs = {"subjects": [{"name": "Computer Science", "level": "intermediate"}]}
    group = {"subject": "Mathematics"}
    result = calculate_math_score(user_prefs, group, [])
    assert result["breakdown"]["subject_match"] == 0

def test_availability_overlap():
    user_prefs = {"availability": {"preset": ["Evening", "Night"]}}
    group = {"session_timing": ["Evening"]}
    result = calculate_math_score(user_prefs, group, [])
    assert result["breakdown"]["availability_overlap"] > 0

def test_format_match():
    user_prefs = {"study_format": "virtual"}
    group = {"study_format": "virtual"}
    result = calculate_math_score(user_prefs, group, [])
    assert result["breakdown"]["format_match"] == 15

def test_member_alignment():
    user_prefs = {"learning_style": "visual", "availability": {"preset": ["Evening"]}}
    member_prefs = [{"learning_style": "visual", "availability": {"preset": ["Evening"]}}]
    score = calculate_member_alignment(user_prefs, member_prefs)
    assert score > 0