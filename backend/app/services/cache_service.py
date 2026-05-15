import time
from typing import Any, Optional

class CacheService:
    def __init__(self):
        self._cache: dict[str, tuple[Any, float]] = {}

    def get(self, key: str) -> Optional[Any]:
        if key in self._cache:
            value, expires_at = self._cache[key]
            if expires_at == 0 or time.time() < expires_at:
                return value
            del self._cache[key]
        return None

    def set(self, key: str, value: Any, ttl_seconds: int = 300):
        expires_at = time.time() + ttl_seconds if ttl_seconds > 0 else 0
        self._cache[key] = (value, expires_at)

    def delete(self, key: str):
        if key in self._cache:
            del self._cache[key]

    def clear_expired(self):
        now = time.time()
        self._cache = {k: v for k, v in self._cache.items() if v[1] == 0 or now < v[1]}

cache = CacheService()
