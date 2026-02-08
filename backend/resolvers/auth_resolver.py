from fastapi import APIRouter, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from db.database import get_db
from services.auth_service import AuthService
from repositories.user_repository import UserRepository
from services.user_service import UserService
from schemas.user import UserWithProgress, LevelProgress
from middleware.auth_middleware import get_current_user
from models.user import User
from config import FRONTEND_URL

router = APIRouter(prefix="/api/auth", tags=["auth"])

auth_service = AuthService()


@router.get("/login")
async def login():
    """Redirect to Google OAuth"""
    auth_url = auth_service.get_google_auth_url()
    return RedirectResponse(url=auth_url)


@router.get("/callback")
async def callback(code: str, db: AsyncSession = Depends(get_db)):
    """Handle Google OAuth callback"""
    try:
        # Exchange code for tokens
        tokens = await auth_service.exchange_code_for_tokens(code)
        access_token = tokens.get("access_token")
        if not access_token:
            raise ValueError("No access token received from Google")

        # Get user info from Google
        google_user = await auth_service.get_google_user_info(access_token)

        google_id = google_user.get("id")
        email = google_user.get("email")
        name = google_user.get("name")
        if not google_id or not email or not name:
            raise ValueError("Missing required user info from Google")

        # Get or create user
        repository = UserRepository(db)
        service = UserService(repository)

        user = await service.get_or_create_by_google(
            google_id=google_id,
            email=email,
            name=name,
            avatar_url=google_user.get("picture"),
        )

        # Create JWT token
        jwt_token = auth_service.create_access_token(user.id, user.email)

        # Redirect to frontend with token
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
        total_exp=current_user.total_exp,
        level=current_user.level,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
        level_progress=LevelProgress(**progress),
    )


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
