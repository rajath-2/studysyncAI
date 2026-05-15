import json
import logging
from groq import Groq
from app.config import get_settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()

SYSTEM_PROMPT = """You are a study group matching assistant. Your goal is to recommend the best
groups for a student based on their preferences and historical match data.

CONTEXT:
- Student preferences: {student_preferences}
- Similar successful matches from past feedback: {relevant_feedback}
- Available groups with member profiles: {available_groups}

GOAL:
Analyze and rank the groups. Consider:
1. Subject alignment
2. Study hours compatibility
3. Goals overlap
4. How well user fits with existing members
5. Past success patterns from similar students

OUTPUT FORMAT:
Return a JSON array of recommendations, each with:
- group_id
- match_score (1-100)
- reasoning (why this group fits)
- suggested_improvements (if any)
"""

class MatchingService:
    def __init__(self):
        self.client = Groq(api_key=settings.groq_api_key)

    async def get_match_reasoning(self, user_prefs: dict, group: dict, members: list[dict]) -> dict:
        """Groq-generated explanation and suggestions for a specific group."""

        logger.info(f"Generating reasoning for group {group.get('id')}")

        prompt = f"""You are a study group matching assistant. Analyze why this user is a good or bad fit.

User Profile:
- Subjects: {user_prefs.get('subjects', [])}
- Availability: {user_prefs.get('availability', {})}
- Learning Style: {user_prefs.get('learning_style', 'not specified')}

Group Details:
- Name: {group.get('name')}
- Subject: {group.get('subject')}
- Format: {group.get('study_format', 'virtual')}
- Timing: {group.get('session_timing', [])}
- Meeting Frequency: {group.get('meeting_frequency', 1)}x per week
- Members: {len(members)} existing members

Provide a JSON response with:
{{
  "reasoning": "2-3 sentences why this is a good/bad match",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}}
"""

        response = self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a helpful study group matching assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=512
        )

        content = response.choices[0].message.content

        # Extract JSON
        try:
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            return json.loads(content.strip())
        except:
            return {"reasoning": "Great compatibility match!", "suggestions": []}

    async def get_recommendations(
        self,
        student_preferences: dict,
        relevant_feedback: list[dict],
        available_groups: list[dict]
    ) -> list[dict]:
        logger.info("=== MATCHING SERVICE STARTED ===")
        logger.info(f"Student preferences: {json.dumps(student_preferences)}")
        logger.info(f"Relevant feedback count: {len(relevant_feedback)}")
        logger.info(f"Available groups count: {len(available_groups)}")
        logger.info(f"Available groups: {json.dumps(available_groups[:5])}")

        prompt = SYSTEM_PROMPT.format(
            student_preferences=json.dumps(student_preferences),
            relevant_feedback=json.dumps(relevant_feedback[:5]),
            available_groups=json.dumps(available_groups[:10])
        )

        logger.info("=== SENDING TO GROQ AI ===")
        logger.info(f"Prompt length: {len(prompt)} chars")
        logger.debug(f"Full prompt: {prompt[:500]}...")

        response = self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a helpful study group matching assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2048
        )

        content = response.choices[0].message.content
        logger.info(f"AI response received, length: {len(content) if content else 0} chars")
        logger.debug(f"AI raw response: {content[:500] if content else 'empty'}")

        # Extract JSON from response
        try:
            if not content:
                logger.warning("AI response was empty")
                return []
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
                logger.info("Extracted JSON from ```json code block")
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
                logger.info("Extracted JSON from ``` code block")
            else:
                logger.info("No code block detected, using raw response")

            logger.debug(f"Parsed JSON content: {content[:300]}...")
            recommendations = json.loads(content.strip())

            if isinstance(recommendations, list):
                logger.info(f"=== MATCHING COMPLETE: {len(recommendations)} recommendations ===")
                for i, rec in enumerate(recommendations):
                    logger.info(f"  Recommendation {i+1}: group_id={rec.get('group_id')}, score={rec.get('match_score')}, reasoning={rec.get('reasoning', '')[:80]}")
                return recommendations
            else:
                logger.warning("AI response was not a list")
                return []
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {e}")
            logger.error(f"Content that failed to parse: {content}")
            return []

matching_service = MatchingService()
