import time
from collections import defaultdict
from fastapi import HTTPException, status

class RateLimiter:
    def __init__(self, requests_per_minute: int = 50):
        self.requests_per_minute = requests_per_minute
        self._requests: dict[str, list[float]] = defaultdict(list)

    def check(self, user_id: str) -> bool:
        now = time.time()
        minute_ago = now - 60

        self._requests[user_id] = [t for t in self._requests[user_id] if t > minute_ago]

        if len(self._requests[user_id]) >= self.requests_per_minute:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later."
            )

        self._requests[user_id].append(now)
        return True

    def clear_old(self):
        now = time.time()
        minute_ago = now - 60
        for user_id in list(self._requests.keys()):
            self._requests[user_id] = [t for t in self._requests[user_id] if t > minute_ago]
            if not self._requests[user_id]:
                del self._requests[user_id]

rate_limiter = RateLimiter()
rate_limiter_matching = RateLimiter(requests_per_minute=10)
