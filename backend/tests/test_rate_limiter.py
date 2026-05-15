import pytest
from fastapi import HTTPException
from app.services.rate_limiter import RateLimiter

def test_rate_limiter_allows_requests():
    limiter = RateLimiter(requests_per_minute=5)
    for i in range(5):
        assert limiter.check(f"user-{i}") == True

def test_rate_limiter_blocks_excess():
    limiter = RateLimiter(requests_per_minute=2)
    limiter.check("user1")
    limiter.check("user1")

    try:
        limiter.check("user1")
        assert False, "Should have raised HTTPException"
    except HTTPException as e:
        assert e.status_code == 429

def test_rate_limiter_different_users():
    limiter = RateLimiter(requests_per_minute=2)
    limiter.check("user1")
    limiter.check("user1")
    # Different user should be allowed
    assert limiter.check("user2") == True

def test_rate_limiter_clear_old():
    limiter = RateLimiter(requests_per_minute=10)
    limiter.check("user1")
    limiter.clear_old()
    # After clearing, should still have the request
    assert len(limiter._requests.get("user1", [])) == 1
