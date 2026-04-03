from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from db.database import get_db
from services.auth_service import AuthService
from repositories.user_repository import UserRepository
from services.user_service import UserService
from schemas.user import UserWithProgress, LevelProgress
from middleware.auth_middleware import get_current_user
from models.user import User
import httpx
from config import FRONTEND_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

router = APIRouter(prefix="/api/auth", tags=["auth"])

auth_service = AuthService()


@router.get("/login")
async def login():
    """Redirect to Google OAuth"""
    auth_url = auth_service.get_google_auth_url()
    return RedirectResponse(url=auth_url)


@router.post("/guest")
async def guest_login(db: AsyncSession = Depends(get_db)):
    """Create a guest account and return a permanent JWT."""
    repository = UserRepository(db)
    service = UserService(repository)
    user = await service.create_guest_user()
    token = auth_service.create_guest_token(user.id)
    return {"token": token}


@router.get("/link-google")
async def link_google(
    current_user: User = Depends(get_current_user),
):
    """Return a Google OAuth URL with a signed state for guest account linking."""
    if not current_user.is_guest:
        raise HTTPException(status_code=400, detail="Account is already linked to Google")
    state = auth_service.create_link_state(current_user.id)
    url = auth_service.get_google_auth_url(state=state)
    return {"url": url}


@router.get("/callback")
async def callback(
    code: str,
    state: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Handle Google OAuth callback — also handles guest account linking via state."""
    try:
        tokens = await auth_service.exchange_code_for_tokens(code)
        access_token = tokens.get("access_token")
        if not access_token:
            raise ValueError("No access token received from Google")

        google_user = await auth_service.get_google_user_info(access_token)
        google_id = google_user.get("id")
        email = google_user.get("email")
        name = google_user.get("name")
        if not google_id or not email or not name:
            raise ValueError("Missing required user info from Google")

        repository = UserRepository(db)
        service = UserService(repository)

        # Guest account link flow
        if state:
            guest_user_id = auth_service.verify_link_state(state)
            if not guest_user_id:
                return RedirectResponse(
                    url=f"{FRONTEND_URL}/login?error=Invalid or tampered link request"
                )
            linked_user = await service.link_google_account(
                guest_user_id=guest_user_id,
                google_id=google_id,
                email=email,
                name=name,
                avatar_url=google_user.get("picture"),
            )
            if not linked_user:
                return RedirectResponse(
                    url=f"{FRONTEND_URL}/login?error=This Google account is already linked to another account"
                )
            jwt_token = auth_service.create_access_token(linked_user.id, linked_user.email)
            return RedirectResponse(url=f"{FRONTEND_URL}/auth/callback?token={jwt_token}")

        # Normal login flow
        user = await service.get_or_create_by_google(
            google_id=google_id,
            email=email,
            name=name,
            avatar_url=google_user.get("picture"),
        )
        jwt_token = auth_service.create_access_token(user.id, user.email)
        return RedirectResponse(url=f"{FRONTEND_URL}/auth/callback?token={jwt_token}")

    except Exception as e:
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error={str(e)}")


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
    code: str
    redirect_uri: str


@router.post("/mobile")
async def mobile_auth(
    body: MobileAuthRequest,
    db: AsyncSession = Depends(get_db),
):
    """Handle Google OAuth for mobile apps — accepts code + redirect_uri, returns JWT."""
    try:
        async with httpx.AsyncClient() as client:
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
        if not google_id or not email or not name:
            raise HTTPException(status_code=400, detail="Missing user info from Google")

        repository = UserRepository(db)
        service = UserService(repository)
        user = await service.get_or_create_by_google(
            google_id=google_id,
            email=email,
            name=name,
            avatar_url=google_user.get("picture"),
        )
        jwt_token = auth_service.create_access_token(user.id, user.email)
        return {"token": jwt_token}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class UserSettings(BaseModel):
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
async def logout(current_user: User = Depends(get_current_user)):
    """Logout user (client should discard token)"""
    return {"message": "Logged out successfully"}


@router.patch("/timezone")
async def update_timezone(
    timezone_offset: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update user's timezone offset (minutes from UTC)"""
    repository = UserRepository(db)
    service = UserService(repository)
    await service.update_user(current_user.id, {"timezone_offset": timezone_offset})
    return {"message": "Timezone updated", "timezone_offset": timezone_offset}
