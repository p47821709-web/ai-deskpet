from functools import lru_cache

class MemoryCache:
    def __init__(self, maxsize: int = 128):
        self.cache = {}
        self.maxsize = maxsize

    def get(self, key: str):
        return self.cache.get(key)

    def set(self, key: str, value):
        if len(self.cache) >= self.maxsize:
            self.cache.pop(next(iter(self.cache)))
        self.cache[key] = value

    def clear(self):
        self.cache.clear()
