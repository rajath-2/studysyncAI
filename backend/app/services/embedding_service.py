import json
from groq import Groq
from app.config import get_settings

settings = get_settings()

class EmbeddingService:
    def __init__(self):
        self.client = Groq(api_key=settings.groq_api_key)

    async def generate_feedback_embedding(self, feedback: dict, group: dict, user_preferences: dict) -> list[float]:
        # Create text representation of feedback for embedding
        context = f"""
        Rating: {feedback.get('rating', 0)}/5
        What worked: {feedback.get('what_worked', '')}
        What could improve: {feedback.get('what_could_improve', '')}
        Subject: {group.get('subject', '')}
        Student preferences: priorities={user_preferences.get('priorities', [])},
        subjects={user_preferences.get('subjects', [])},
        hours={user_preferences.get('hours', [])}
        """

        response = self.client.embeddings.create(
            model="llama-3.3-70b-versatile",
            input=context
        )

        # Use last token embedding as a rough approximation
        # In production, use a dedicated embedding model like sentence-transformers
        return [0.0] * 1024  # Placeholder - would need actual embedding model

embedding_service = EmbeddingService()
