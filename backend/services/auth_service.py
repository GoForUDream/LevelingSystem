import secrets
from datetime import datetime, timezone, timedelta
from urllib.parse import urlencode

from jose import jwt, JWTError
import httpx
from config import (
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    JWT_SECRET,
    JWT_ALGORITHM,
    JWT_EXPIRATION_HOURS,
)


class AuthService:
    GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
    GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
    GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

    def get_google_auth_url(self, state: str) -> str:
        params = {
            "client_id": GOOGLE_CLIENT_ID,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": "openid email profile",
            "prompt": "select_account",
        }
        params["state"] = state
        return f"{self.GOOGLE_AUTH_URL}?{urlencode(params)}"

    async def exchange_code_for_tokens(self, code: str) -> dict:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                self.GOOGLE_TOKEN_URL,
                data={
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": GOOGLE_REDIRECT_URI,
                },
            )
            response.raise_for_status()
            return response.json()

    async def get_google_user_info(self, access_token: str) -> dict:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                self.GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            response.raise_for_status()
            return response.json()

    def create_access_token(
        self, user_id: int, email: str | None = None, session_version: int = 0
    ) -> str:
        expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
        payload: dict = {
            "sub": str(user_id),
            "exp": expire,
            "iat": datetime.now(timezone.utc),
            "sv": session_version,
        }
        if email:
            payload["email"] = email
        return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    def create_guest_token(self, user_id: int, session_version: int = 0) -> str:
        """Guest sessions expire like normal sessions."""
        return self.create_access_token(user_id, session_version=session_version)

    def create_oauth_state(self, guest_user_id: int | None = None) -> str:
        now = datetime.now(timezone.utc)
        payload = {
            "purpose": "oauth_state",
            "nonce": secrets.token_urlsafe(24),
            "iat": now,
            "exp": now + timedelta(minutes=10),
        }
        if guest_user_id is not None:
            payload["guest_id"] = guest_user_id
        return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    def verify_oauth_state(self, state: str) -> dict | None:
        try:
            payload = jwt.decode(state, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            if payload.get("purpose") != "oauth_state" or not payload.get("nonce"):
                return None
            return payload
        except JWTError:
            return None

    def verify_token(self, token: str) -> dict | None:
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            return payload
        except JWTError:
            return None
