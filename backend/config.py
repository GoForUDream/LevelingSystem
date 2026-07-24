import os
from dotenv import load_dotenv

load_dotenv()

ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()
IS_PRODUCTION = ENVIRONMENT == "production"

# Google OAuth
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/auth/callback")
MOBILE_REDIRECT_URIS = {
    uri.strip()
    for uri in os.getenv("MOBILE_REDIRECT_URIS", "").split(",")
    if uri.strip()
}

# JWT
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 1 week
SESSION_COOKIE_NAME = os.getenv("SESSION_COOKIE_NAME", "leveling_session")
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "true" if IS_PRODUCTION else "false").lower() == "true"

# Frontend
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", FRONTEND_URL).split(",")
    if origin.strip()
]
ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
    if host.strip()
]
TRUST_PROXY_HEADERS = os.getenv("TRUST_PROXY_HEADERS", "false").lower() == "true"
DATABASE_ECHO = os.getenv("DATABASE_ECHO", "false").lower() == "true"
DATABASE_POOL_SIZE = int(os.getenv("DATABASE_POOL_SIZE", "5"))
DATABASE_MAX_OVERFLOW = int(os.getenv("DATABASE_MAX_OVERFLOW", "10"))
DATABASE_POOL_TIMEOUT = int(os.getenv("DATABASE_POOL_TIMEOUT", "30"))

# Personal-use access controls
ALLOWED_EMAILS = {
    email.strip().lower()
    for email in os.getenv("ALLOWED_EMAILS", "").split(",")
    if email.strip()
}
ALLOW_GUEST_LOGIN = os.getenv(
    "ALLOW_GUEST_LOGIN", "false" if IS_PRODUCTION else "true"
).lower() == "true"


def validate_config() -> None:
    if not IS_PRODUCTION:
        return

    missing = [
        name
        for name, value in {
            "GOOGLE_CLIENT_ID": GOOGLE_CLIENT_ID,
            "GOOGLE_CLIENT_SECRET": GOOGLE_CLIENT_SECRET,
            "JWT_SECRET": JWT_SECRET,
            "FRONTEND_URL": FRONTEND_URL,
            "GOOGLE_REDIRECT_URI": GOOGLE_REDIRECT_URI,
        }.items()
        if not value
    ]
    if missing:
        raise RuntimeError(f"Missing production configuration: {', '.join(missing)}")
    if JWT_SECRET in {"your-secret-key-change-in-production", "change-this-local-secret"}:
        raise RuntimeError("JWT_SECRET must be replaced in production")
    if len(JWT_SECRET) < 32:
        raise RuntimeError("JWT_SECRET must contain at least 32 characters")
    if not FRONTEND_URL.startswith("https://") or not GOOGLE_REDIRECT_URI.startswith("https://"):
        raise RuntimeError("Production frontend and OAuth callback URLs must use HTTPS")
