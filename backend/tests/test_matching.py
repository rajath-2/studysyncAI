import pytest

def test_matching_service_structure():
    # Test would require Groq API key
    # For now, just verify the service structure exists and can be imported
    from app.services.matching_service import MatchingService, matching_service

    assert matching_service is not None
    assert isinstance(matching_service, MatchingService)
    assert hasattr(matching_service, 'get_recommendations')
    assert hasattr(matching_service, 'client')
