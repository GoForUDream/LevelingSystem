import os
from urllib.parse import parse_qs, urlparse

import httpx
import pytest
from jose import jwt

os.environ.setdefault(
    "DATABASE_URL", "postgresql+asyncpg://leveling:leveling123@localhost:5433/leveling_system"
)

from config import JWT_ALGORITHM, JWT_SECRET
from main import app
from services.auth_service import AuthService


def test_public_user_admin_routes_are_not_registered():
    paths = {route.path for route in app.routes}
    assert not any(path == "/api/users" or path.startswith("/api/users/") for path in paths)


def test_oauth_state_is_signed_and_rejects_tampering():
    service = AuthService()
    state = service.create_oauth_state(guest_user_id=42)

    payload = service.verify_oauth_state(state)
    assert payload is not None
    assert payload["guest_id"] == 42

    replacement = "a" if state[len(state) // 2] != "a" else "b"
    tampered = state[: len(state) // 2] + replacement + state[len(state) // 2 + 1 :]
    assert service.verify_oauth_state(tampered) is None


def test_session_token_expires_and_carries_revocation_version():
    token = AuthService().create_access_token(7, "user@example.com", session_version=3)
    payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])

    assert payload["sub"] == "7"
    assert payload["sv"] == 3
    assert payload["exp"] > payload["iat"]


@pytest.mark.asyncio
async def test_login_binds_oauth_state_to_browser_cookie():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(
        transport=transport, base_url="http://localhost", follow_redirects=False
    ) as client:
        response = await client.get("/api/auth/login")

    state = parse_qs(urlparse(response.headers["location"]).query)["state"][0]
    assert response.cookies["leveling_oauth_state"] == state
