from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from services.auth_service import AuthService
from sqlalchemy.ext.asyncio import AsyncSession
from db.database import get_db
from repositories.user_repository import UserRepository
from config import SESSION_COOKIE_NAME

security = HTTPBearer(auto_error=False)
auth_service = AuthService()


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if not token and credentials:
        token = credentials.credentials
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    payload = auth_service.verify_token(token)

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    try:
        user_id = int(payload.get("sub", ""))
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token subject")
    repository = UserRepository(db)
    user = await repository.get_by_id(user_id)

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    if not user.is_active:
        raise HTTPException(status_code=401, detail="User is inactive")

    if payload.get("sv") != user.session_version:
        raise HTTPException(status_code=401, detail="Session has been revoked")

    return user
