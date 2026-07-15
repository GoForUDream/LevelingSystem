from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from fastapi.responses import RedirectResponse, JSONResponse
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.ext.asyncio import AsyncSession
from db.database import get_db
from services.auth_service import AuthService
from repositories.user_repository import UserRepository
from services.user_service import UserService
from schemas.user import UserWithProgress, LevelProgress
from middleware.auth_middleware import get_current_user
from models.user import User
import httpx
import hmac
from urllib.parse import urlencode
from config import (
    ALLOWED_EMAILS,
    ALLOW_GUEST_LOGIN,
    FRONTEND_URL,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    IS_PRODUCTION,
    MOBILE_REDIRECT_URIS,
    COOKIE_SECURE,
    JWT_EXPIRATION_HOURS,
    SESSION_COOKIE_NAME,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

auth_service = AuthService()
OAUTH_STATE_COOKIE_NAME = "leveling_oauth_state"


def set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        max_age=JWT_EXPIRATION_HOURS * 3600,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
        path="/",
    )


def set_oauth_state_cookie(response: Response, state: str) -> None:
    response.set_cookie(
        key=OAUTH_STATE_COOKIE_NAME,
        value=state,
        max_age=600,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
        path="/api/auth/callback",
    )


def frontend_redirect(path: str, **query: str) -> str:
    suffix = f"?{urlencode(query)}" if query else ""
    return f"{FRONTEND_URL}{path}{suffix}"


def ensure_email_allowed(email: str) -> None:
    if ALLOWED_EMAILS and email.lower() not in ALLOWED_EMAILS:
        raise HTTPException(status_code=403, detail="This app is restricted to its owner")


@router.get("/login")
async def login():
    """Redirect to Google OAuth"""
    state = auth_service.create_oauth_state()
    response = RedirectResponse(url=auth_service.get_google_auth_url(state))
    set_oauth_state_cookie(response, state)
    return response


@router.post("/guest")
async def guest_login(db: AsyncSession = Depends(get_db)):
    """Create a guest account and establish an expiring browser session."""
    if not ALLOW_GUEST_LOGIN:
        raise HTTPException(status_code=403, detail="Guest login is disabled")
    repository = UserRepository(db)
    service = UserService(repository)
    user = await service.create_guest_user()
    token = auth_service.create_guest_token(user.id, user.session_version)
    response = JSONResponse({"authenticated": True})
    set_session_cookie(response, token)
    return response


@router.get("/link-google")
async def link_google(
    current_user: User = Depends(get_current_user),
):
    """Return a Google OAuth URL with a signed state for guest account linking."""
    if not current_user.is_guest:
        raise HTTPException(status_code=400, detail="Account is already linked to Google")
    state = auth_service.create_oauth_state(current_user.id)
    url = auth_service.get_google_auth_url(state=state)
    response = JSONResponse({"url": url})
    set_oauth_state_cookie(response, state)
    return response


@router.get("/callback")
async def callback(
    request: Request,
    code: str,
    state: str,
    db: AsyncSession = Depends(get_db),
):
    """Handle Google OAuth callback — also handles guest account linking via state."""
    try:
        cookie_state = request.cookies.get(OAUTH_STATE_COOKIE_NAME)
        state_payload = auth_service.verify_oauth_state(state)
        if not cookie_state or not hmac.compare_digest(cookie_state, state) or not state_payload:
            return RedirectResponse(frontend_redirect("/login", error="Invalid or expired login request"))

        tokens = await auth_service.exchange_code_for_tokens(code)
        access_token = tokens.get("access_token")
        if not access_token:
            raise ValueError("No access token received from Google")

        google_user = await auth_service.get_google_user_info(access_token)
        google_id = google_user.get("id")
        email = google_user.get("email")
        name = google_user.get("name")
        if not google_id or not email or not name or not google_user.get("verified_email"):
            raise ValueError("Missing required user info from Google")
        ensure_email_allowed(email)

        repository = UserRepository(db)
        service = UserService(repository)

        # Guest account link flow
        guest_user_id = state_payload.get("guest_id")
        if guest_user_id is not None:
            linked_user = await service.link_google_account(
                guest_user_id=int(guest_user_id),
                google_id=google_id,
                email=email,
                name=name,
                avatar_url=google_user.get("picture"),
            )
            if not linked_user:
                return RedirectResponse(frontend_redirect(
                    "/login", error="This Google account is already linked to another account"
                ))
            jwt_token = auth_service.create_access_token(
                linked_user.id, linked_user.email, linked_user.session_version
            )
            response = RedirectResponse(frontend_redirect("/auth/callback"))
            set_session_cookie(response, jwt_token)
            response.delete_cookie(OAUTH_STATE_COOKIE_NAME, path="/api/auth/callback")
            return response

        # Normal login flow
        user = await service.get_or_create_by_google(
            google_id=google_id,
            email=email,
            name=name,
            avatar_url=google_user.get("picture"),
        )
        jwt_token = auth_service.create_access_token(
            user.id, user.email, user.session_version
        )
        response = RedirectResponse(frontend_redirect("/auth/callback"))
        set_session_cookie(response, jwt_token)
        response.delete_cookie(OAUTH_STATE_COOKIE_NAME, path="/api/auth/callback")
        return response

    except Exception:
        return RedirectResponse(frontend_redirect("/login", error="Authentication failed"))


@router.get("/me", response_model=UserWithProgress)
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current authenticated user with level progress"""
    repository = UserRepository(db)
    service = UserService(repository)
    progress = service.get_user_progress(current_user)

    return UserWithProgress(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        avatar_url=current_user.avatar_url,
        google_id=current_user.google_id,
        is_guest=current_user.is_guest,
        language=current_user.language,
        total_exp=current_user.total_exp,
        level=current_user.level,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
        level_progress=LevelProgress(**progress),
    )


class MobileAuthRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str = Field(min_length=1, max_length=4096)
    redirect_uri: str = Field(min_length=1, max_length=2048)


@router.post("/mobile")
async def mobile_auth(
    body: MobileAuthRequest,
    db: AsyncSession = Depends(get_db),
):
    """Handle Google OAuth for mobile apps — accepts code + redirect_uri, returns JWT."""
    try:
        if IS_PRODUCTION and body.redirect_uri not in MOBILE_REDIRECT_URIS:
            raise HTTPException(status_code=400, detail="Unsupported mobile redirect URI")
        async with httpx.AsyncClient(timeout=10.0) as client:
            token_res = await client.post(
                auth_service.GOOGLE_TOKEN_URL,
                data={
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "code": body.code,
                    "grant_type": "authorization_code",
                    "redirect_uri": body.redirect_uri,
                },
            )
            token_res.raise_for_status()
            tokens = token_res.json()

        access_token = tokens.get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="No access token from Google")

        google_user = await auth_service.get_google_user_info(access_token)
        google_id = google_user.get("id")
        email = google_user.get("email")
        name = google_user.get("name")
        if not google_id or not email or not name or not google_user.get("verified_email"):
            raise HTTPException(status_code=400, detail="Missing user info from Google")
        ensure_email_allowed(email)

        repository = UserRepository(db)
        service = UserService(repository)
        user = await service.get_or_create_by_google(
            google_id=google_id,
            email=email,
            name=name,
            avatar_url=google_user.get("picture"),
        )
        jwt_token = auth_service.create_access_token(
            user.id, user.email, user.session_version
        )
        return {"token": jwt_token}

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=502, detail="Google authentication failed")


class UserSettings(BaseModel):
    model_config = ConfigDict(extra="forbid")

    language: str


@router.patch("/settings")
async def update_settings(
    settings: UserSettings,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update user preferences (language, etc.)"""
    allowed_languages = {"en", "vi"}
    if settings.language not in allowed_languages:
        raise HTTPException(status_code=400, detail="Unsupported language")
    repository = UserRepository(db)
    service = UserService(repository)
    await service.update_user(current_user.id, {"language": settings.language})
    return {"language": settings.language}


@router.post("/logout")
async def logout(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repository = UserRepository(db)
    await repository.update(
        current_user.id, {"session_version": current_user.session_version + 1}
    )
    response.delete_cookie(
        SESSION_COOKIE_NAME,
        path="/",
        secure=COOKIE_SECURE,
        httponly=True,
        samesite="lax",
    )
    return {"message": "Logged out successfully"}


@router.patch("/timezone")
async def update_timezone(
    timezone_offset: int = Query(ge=-840, le=840),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update user's timezone offset (minutes from UTC)"""
    repository = UserRepository(db)
    service = UserService(repository)
    await service.update_user(current_user.id, {"timezone_offset": timezone_offset})
    return {"message": "Timezone updated", "timezone_offset": timezone_offset}
