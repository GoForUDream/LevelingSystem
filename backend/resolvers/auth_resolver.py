from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from db.database import get_db
from services.auth_service import AuthService
from repositories.user_repository import UserRepository
from services.user_service import UserService
from schemas.user import UserResponse
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

        # Get user info from Google
        google_user = await auth_service.get_google_user_info(access_token)

        # Get or create user
        repository = UserRepository(db)
        service = UserService(repository)

        user = await service.get_or_create_by_google(
            google_id=google_user.get("id"),
            email=google_user.get("email"),
            name=google_user.get("name"),
            avatar_url=google_user.get("picture"),
        )

        # Create JWT token
        jwt_token = auth_service.create_access_token(user.id, user.email)

        # Redirect to frontend with token
        return RedirectResponse(url=f"{FRONTEND_URL}/auth/callback?token={jwt_token}")

    except Exception as e:
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error={str(e)}")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user"""
    return current_user


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Logout user (client should discard token)"""
    return {"message": "Logged out successfully"}
