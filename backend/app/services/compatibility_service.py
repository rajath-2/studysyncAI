# backend/app/services/compatibility_service.py
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)


def calculate_math_score(user_prefs: dict, group: dict, member_prefs: List[dict]) -> dict:
    """Fast scoring for instant display. Returns score (0-100) and breakdown."""

    # Subject Match (40 points max)
    user_subjects = [s["name"] for s in user_prefs.get("subjects", [])]
    group_subject = group.get("subject", "")
    subject_match = 40 if group_subject in user_subjects else 0

    # Availability Overlap (30 points max)
    user_availability = user_prefs.get("availability", {}).get("preset", [])
    group_timing = group.get("session_timing", [])
    if user_availability and group_timing:
        matched = len(set(user_availability) & set(group_timing))
        availability_overlap = (matched / len(user_availability)) * 30
    else:
        availability_overlap = 0

    # Format Match (15 points max)
    user_format = user_prefs.get("study_format", "virtual")
    group_format = group.get("study_format", "virtual")
    if user_format == group_format:
        format_match = 15
    elif group_format == "hybrid" or user_format == "hybrid":
        format_match = 7.5
    else:
        format_match = 0

    # Member Alignment (15 points max)
    member_alignment = calculate_member_alignment(user_prefs, member_prefs)

    total_score = min(subject_match + availability_overlap + format_match + member_alignment, 100)

    return {
        "score": round(total_score),
        "breakdown": {
            "subject_match": subject_match,
            "availability_overlap": round(availability_overlap),
            "format_match": format_match,
            "member_alignment": round(member_alignment)
        },
        "matching_slots": list(set(user_availability) & set(group_timing)) if group_timing else []
    }


def calculate_member_alignment(user_prefs: dict, member_prefs: List[dict]) -> float:
    """Returns 0-15 based on how well user fits with members."""
    if not member_prefs:
        return 0

    scores = []
    for member in member_prefs:
        score = 0
        # Learning style match (5 points)
        if user_prefs.get("learning_style") == member.get("learning_style"):
            score += 5

        # Availability overlap (5 points)
        user_avail = set(user_prefs.get("availability", {}).get("preset", []))
        member_avail = set(member.get("availability", {}).get("preset", []))
        if user_avail and member_avail:
            overlap = len(user_avail & member_avail) / len(user_avail)
            score += overlap * 5

        # Level compatibility (5 points)
        user_level = next((s["level"] for s in user_prefs.get("subjects", []) if True), "intermediate")
        member_level = next((s["level"] for s in member.get("subjects", []) if True), "intermediate")
        if user_level == member_level:
            score += 5

        scores.append(score)

    return sum(scores) / len(scores) if scores else 0