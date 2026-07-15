import httpx
import pytest
from fastapi import FastAPI

from middleware.rate_limit import AuthRateLimitMiddleware


@pytest.mark.asyncio
async def test_guest_login_is_rate_limited():
    test_app = FastAPI()
    test_app.add_middleware(AuthRateLimitMiddleware)

    @test_app.post("/api/auth/guest")
    async def guest():
        return {"ok": True}

    transport = httpx.ASGITransport(app=test_app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        for _ in range(5):
            assert (await client.post("/api/auth/guest")).status_code == 200
        response = await client.post("/api/auth/guest")

    assert response.status_code == 429
    assert response.headers["Retry-After"] == "3600"
