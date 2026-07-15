import asyncio
import time
from collections import defaultdict, deque

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from config import TRUST_PROXY_HEADERS


class AuthRateLimitMiddleware(BaseHTTPMiddleware):
    """Small per-process limiter for public auth endpoints."""

    LIMITS = {
        ("POST", "/api/auth/guest"): (5, 3600),
        ("GET", "/api/auth/login"): (30, 60),
        ("GET", "/api/auth/callback"): (30, 60),
        ("POST", "/api/auth/mobile"): (30, 60),
    }

    def __init__(self, app):
        super().__init__(app)
        self._requests: dict[tuple[str, str, str], deque[float]] = defaultdict(deque)
        self._lock = asyncio.Lock()

    @staticmethod
    def _client_ip(request: Request) -> str:
        if TRUST_PROXY_HEADERS:
            forwarded = request.headers.get("x-forwarded-for")
            if forwarded:
                return forwarded.split(",", 1)[0].strip()
        return request.client.host if request.client else "unknown"

    async def dispatch(self, request: Request, call_next):
        rule = self.LIMITS.get((request.method, request.url.path))
        if rule is None:
            return await call_next(request)

        limit, window = rule
        now = time.monotonic()
        key = (request.method, request.url.path, self._client_ip(request))
        async with self._lock:
            bucket = self._requests[key]
            while bucket and bucket[0] <= now - window:
                bucket.popleft()
            if len(bucket) >= limit:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests. Try again later."},
                    headers={"Retry-After": str(window)},
                )
            bucket.append(now)

            if len(self._requests) > 10_000:
                self._requests = defaultdict(
                    deque, {k: v for k, v in self._requests.items() if v}
                )

        return await call_next(request)
