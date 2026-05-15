import pytest
import time
from app.services.cache_service import CacheService

def test_cache_set_get():
    cache = CacheService()
    cache.set("key1", "value1", ttl_seconds=60)
    assert cache.get("key1") == "value1"

def test_cache_expiry():
    cache = CacheService()
    cache.set("key2", "value2", ttl_seconds=1)
    time.sleep(1.1)
    assert cache.get("key2") is None

def test_cache_delete():
    cache = CacheService()
    cache.set("key3", "value3")
    cache.delete("key3")
    assert cache.get("key3") is None

def test_cache_clear_expired():
    cache = CacheService()
    cache.set("key4", "value4", ttl_seconds=1)
    time.sleep(1.1)
    cache.clear_expired()
    assert cache.get("key4") is None
