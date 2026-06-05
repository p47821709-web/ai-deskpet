def test_cache():
    from app.core.cache import MemoryCache
    cache = MemoryCache()
    cache.set("key", "value")
    assert cache.get("key") == "value"
