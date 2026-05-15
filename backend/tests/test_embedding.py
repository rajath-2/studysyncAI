import pytest

def test_embedding_service_structure():
    # Test would require Groq API key
    # For now, just verify the service structure exists and can be imported
    from app.services.embedding_service import EmbeddingService, embedding_service

    assert embedding_service is not None
    assert isinstance(embedding_service, EmbeddingService)
    assert hasattr(embedding_service, 'generate_feedback_embedding')
    assert hasattr(embedding_service, 'client')
