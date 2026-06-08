"""
In-memory search result cache with TTL.

Caches completed search results so repeated searches for the same hotel+dates
within the TTL window return instantly instead of triggering new Playwright sessions.
This is critical for production: a single Playwright search takes ~30s; with many
users searching the same popular hotels, the cache absorbs almost all repeated load.
"""

import asyncio
from datetime import datetime, timedelta
from typing import Any


class SearchCache:
    def __init__(self, ttl_hours: float = 3.0):
        self._store: dict[str, tuple[datetime, Any]] = {}
        self._ttl = timedelta(hours=ttl_hours)
        self._lock = asyncio.Lock()

    def _cache_key(self, hotel_name: str | None, location: str, checkin: str, checkout: str, adults: int) -> str:
        return f"{(hotel_name or '').strip().lower()}|{location.strip().lower()}|{checkin}|{checkout}|{adults}"

    async def get(self, hotel_name, location, checkin, checkout, adults) -> Any | None:
        key = self._cache_key(hotel_name, location, checkin, checkout, adults)
        async with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            ts, value = entry
            if datetime.now() - ts > self._ttl:
                del self._store[key]
                return None
            return value

    async def set(self, hotel_name, location, checkin, checkout, adults, value: Any) -> None:
        key = self._cache_key(hotel_name, location, checkin, checkout, adults)
        async with self._lock:
            self._store[key] = (datetime.now(), value)
            # Evict entries older than 2× TTL to keep memory bounded
            cutoff = datetime.now() - self._ttl * 2
            stale = [k for k, (ts, _) in self._store.items() if ts < cutoff]
            for k in stale:
                del self._store[k]

    async def invalidate(self, hotel_name, location, checkin, checkout, adults) -> None:
        key = self._cache_key(hotel_name, location, checkin, checkout, adults)
        async with self._lock:
            self._store.pop(key, None)


# Shared instance used by main.py
search_cache = SearchCache(ttl_hours=3)
