import base64
import hashlib
import hmac
import json
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

    def get_google_auth_url(self, state: str | None = None) -> str:
        params = {
            "client_id": GOOGLE_CLIENT_ID,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "offline",
            "prompt": "consent",
        }
        if state:
            params["state"] = state
        return f"{self.GOOGLE_AUTH_URL}?{urlencode(params)}"

    async def exchange_code_for_tokens(self, code: str) -> dict:
        async with httpx.AsyncClient() as client:
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
        async with httpx.AsyncClient() as client:
            response = await client.get(
                self.GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            response.raise_for_status()
            return response.json()

    def create_access_token(self, user_id: int, email: str | None = None) -> str:
        expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
        payload: dict = {
            "sub": str(user_id),
            "exp": expire,
            "iat": datetime.now(timezone.utc),
        }
        if email:
            payload["email"] = email
        return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    def create_guest_token(self, user_id: int) -> str:
        """Issue a permanent (no-expiry) token for guest accounts."""
        payload = {
            "sub": str(user_id),
            "iat": datetime.now(timezone.utc),
            "guest": True,
        }
        return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    def create_link_state(self, guest_user_id: int) -> str:
        """Encode a signed guest_user_id into an OAuth state parameter."""
        payload = json.dumps({"guest_id": guest_user_id})
        sig = hmac.new(
            JWT_SECRET.encode(), payload.encode(), hashlib.sha256
        ).hexdigest()
        combined = f"{payload}|||{sig}"
        return base64.urlsafe_b64encode(combined.encode()).decode()

    def verify_link_state(self, state: str) -> int | None:
        """Decode and verify the OAuth state parameter. Returns guest_user_id or None."""
        try:
            decoded = base64.urlsafe_b64decode(state.encode()).decode()
            payload_str, sig = decoded.split("|||", 1)
            expected_sig = hmac.new(
                JWT_SECRET.encode(), payload_str.encode(), hashlib.sha256
            ).hexdigest()
            if not hmac.compare_digest(sig, expected_sig):
                return None
            payload = json.loads(payload_str)
            return int(payload["guest_id"])
        except Exception:
            return None

    def verify_token(self, token: str) -> dict | None:
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            return payload
        except JWTError:
            return None
