# Guest Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent guest account system that creates a real DB user with no credentials, issues a permanent JWT, and lets the guest upgrade to a Google account at any time.

**Architecture:** A new `POST /api/auth/guest` endpoint creates a `User` record with `is_guest=True` and no email/google_id, returning a no-expiry JWT. A `GET /api/auth/link-google` endpoint (requires auth) generates a signed OAuth `state` parameter encoding the guest user ID; the existing OAuth callback detects this state and updates the guest record with Google credentials instead of creating a new user. The frontend adds a "Play as Guest" button with a warning modal on the login page and a "Link Google Account" item in the header dropdown for guest users.

**Tech Stack:** FastAPI, SQLAlchemy 2.0 async, python-jose, React 19, TypeScript, Tailwind CSS 4, Radix UI Dialog

---

## Files Modified / Created

**Backend:**
- Modify: `backend/models/user.py` — add `is_guest`, make `email` nullable
- Modify: `backend/schemas/user.py` — make `email: str | None`, add `is_guest: bool`
- Modify: `backend/services/auth_service.py` — add guest token + link state helpers, update `get_google_auth_url` and `create_access_token`
- Modify: `backend/services/user_service.py` — add `create_guest_user()`, `link_google_account()`
- Modify: `backend/resolvers/auth_resolver.py` — add `/guest` and `/link-google` endpoints, update `/callback` for link state

**Frontend:**
- Modify: `frontend/src/contexts/AuthContext.tsx` — add `is_guest` to User type, add `loginAsGuest`, `linkGoogleAccount`, `isGuest`
- Create: `frontend/src/components/GuestWarningModal.tsx`
- Modify: `frontend/src/pages/LoginPage.tsx` — guest button + warning modal
- Modify: `frontend/src/components/Header.tsx` — link Google Account option for guest users

---

## Task 1: Update User Model — Add `is_guest`, Make `email` Nullable

**Files:**
- Modify: `backend/models/user.py`

- [ ] **Step 1: Update the model**

Replace the `email` and add `is_guest` fields in `backend/models/user.py`:

```python
from sqlalchemy import String, Text, Integer, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from db.database import Base
from datetime import datetime


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    google_id: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)

    total_exp: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    level: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    # Timezone offset in minutes from UTC (e.g., UTC+7 = 420, UTC-5 = -300)
    timezone_offset: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_guest: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), onupdate=func.now()
    )
```

- [ ] **Step 2: Reset the database so SQLAlchemy recreates the table with the new schema**

```bash
docker-compose down -v
docker-compose up -d
```

Expected: Container restarts clean. The backend's `create_all` will rebuild the table on next startup.

- [ ] **Step 3: Start the backend and confirm it boots without errors**

```bash
cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000
```

Expected: Server starts, logs show "Startup overdue check complete."

- [ ] **Step 4: Commit**

```bash
git add backend/models/user.py
git commit -m "feat: make email nullable, add is_guest flag to User model"
```

---

## Task 2: Update Pydantic Schemas

**Files:**
- Modify: `backend/schemas/user.py`

- [ ] **Step 1: Update `UserResponse` to reflect nullable email and add `is_guest`**

Replace the full contents of `backend/schemas/user.py`:

```python
from pydantic import BaseModel
from datetime import datetime


class UserCreate(BaseModel):
    email: str | None = None
    name: str
    avatar_url: str | None = None
    google_id: str | None = None


class UserUpdate(BaseModel):
    name: str | None = None
    avatar_url: str | None = None
    is_active: bool | None = None


class LevelProgress(BaseModel):
    level: int
    total_exp: int
    current_level_exp: int
    exp_to_next_level: int
    progress_percent: float
    rank_title: str
    rank_theme: str


class UserResponse(BaseModel):
    id: int
    email: str | None
    name: str
    avatar_url: str | None
    google_id: str | None
    is_guest: bool
    total_exp: int
    level: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserWithProgress(UserResponse):
    level_progress: LevelProgress
```

- [ ] **Step 2: Commit**

```bash
git add backend/schemas/user.py
git commit -m "feat: make email optional and add is_guest to user schemas"
```

---

## Task 3: Update AuthService — Guest Token + Link State Helpers

**Files:**
- Modify: `backend/services/auth_service.py`

- [ ] **Step 1: Replace `backend/services/auth_service.py` with the updated version**

```python
import base64
import hashlib
import hmac
import json
from datetime import datetime, timezone, timedelta

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
        query = "&".join(f"{k}={v}" for k, v in params.items())
        return f"{self.GOOGLE_AUTH_URL}?{query}"

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
```

- [ ] **Step 2: Commit**

```bash
git add backend/services/auth_service.py
git commit -m "feat: add guest token, link state helpers to AuthService"
```

---

## Task 4: Update UserService — Guest Creation + Account Linking

**Files:**
- Modify: `backend/services/user_service.py`

- [ ] **Step 1: Add `create_guest_user` and `link_google_account` methods**

Add these two methods to the `UserService` class in `backend/services/user_service.py` (after `get_or_create_by_google`, before `get_all_users`):

```python
    async def create_guest_user(self) -> User:
        import random
        guest_number = random.randint(1000, 9999)
        user = User(
            name=f"Guest #{guest_number}",
            is_guest=True,
        )
        return await self.repository.create(user)

    async def link_google_account(
        self,
        guest_user_id: int,
        google_id: str,
        email: str,
        name: str,
        avatar_url: str | None,
    ) -> User | None:
        """Link a Google account to an existing guest user. Returns None if google_id already taken."""
        existing = await self.repository.get_by_google_id(google_id)
        if existing:
            return None
        return await self.repository.update(
            guest_user_id,
            {
                "google_id": google_id,
                "email": email,
                "name": name,
                "avatar_url": avatar_url,
                "is_guest": False,
            },
        )
```

- [ ] **Step 2: Commit**

```bash
git add backend/services/user_service.py
git commit -m "feat: add create_guest_user and link_google_account to UserService"
```

---

## Task 5: Update Auth Resolver — New Endpoints + Callback Link Handling

**Files:**
- Modify: `backend/resolvers/auth_resolver.py`

- [ ] **Step 1: Replace `backend/resolvers/auth_resolver.py` with the updated version**

```python
from fastapi import APIRouter, Depends, HTTPException
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
            if guest_user_id:
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
```

- [ ] **Step 2: Restart the backend and verify the new endpoints appear in Swagger**

Open http://localhost:8000/docs and confirm:
- `POST /api/auth/guest` is listed
- `GET /api/auth/link-google` is listed
- `GET /api/auth/callback` now accepts an optional `state` query param

- [ ] **Step 3: Smoke test guest endpoint**

```bash
curl -s -X POST http://localhost:8000/api/auth/guest | python3 -m json.tool
```

Expected output:
```json
{
    "token": "<jwt string>"
}
```

- [ ] **Step 4: Commit**

```bash
git add backend/resolvers/auth_resolver.py
git commit -m "feat: add guest login and link-google endpoints, handle link state in OAuth callback"
```

---

## Task 6: Update AuthContext — Guest Support

**Files:**
- Modify: `frontend/src/contexts/AuthContext.tsx`

- [ ] **Step 1: Replace the full contents of `frontend/src/contexts/AuthContext.tsx`**

```typescript
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { API_URL } from '@/lib/utils'

interface LevelProgress {
  level: number
  total_exp: number
  current_level_exp: number
  exp_to_next_level: number
  progress_percent: number
  rank_title: string
  rank_theme: string
}

interface User {
  id: number
  email: string | null
  name: string
  avatar_url: string | null
  is_guest: boolean
  total_exp: number
  level: number
  level_progress: LevelProgress
  created_at: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isGuest: boolean
  login: () => void
  loginAsGuest: () => Promise<void>
  linkGoogleAccount: () => Promise<void>
  logout: () => void
  setToken: (token: string) => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setTokenState] = useState<string | null>(() =>
    localStorage.getItem('token')
  )
  const [isLoading, setIsLoading] = useState(true)

  const setToken = (newToken: string) => {
    localStorage.setItem('token', newToken)
    setTokenState(newToken)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setTokenState(null)
    setUser(null)
  }

  const login = () => {
    window.location.href = `${API_URL}/api/auth/login`
  }

  const loginAsGuest = async () => {
    const response = await fetch(`${API_URL}/api/auth/guest`, { method: 'POST' })
    const data = await response.json()
    setToken(data.token)
  }

  const linkGoogleAccount = async () => {
    if (!token) return
    const response = await fetch(`${API_URL}/api/auth/link-google`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await response.json()
    window.location.href = data.url
  }

  const syncTimezone = useCallback(async () => {
    if (!token) return
    const timezoneOffset = -new Date().getTimezoneOffset()
    try {
      await fetch(`${API_URL}/api/auth/timezone?timezone_offset=${timezoneOffset}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    } catch (error) {
      console.error('Failed to sync timezone:', error)
    }
  }, [token])

  const fetchUser = useCallback(async () => {
    if (!token) {
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        syncTimezone()
      } else {
        logout()
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
      logout()
    } finally {
      setIsLoading(false)
    }
  }, [token, syncTimezone])

  const refreshUser = useCallback(async () => {
    await fetchUser()
  }, [fetchUser])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const isGuest = user?.is_guest ?? false

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isGuest, login, loginAsGuest, linkGoogleAccount, logout, setToken, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd frontend && npm run typecheck
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/contexts/AuthContext.tsx
git commit -m "feat: add loginAsGuest, linkGoogleAccount, isGuest to AuthContext"
```

---

## Task 7: Create GuestWarningModal Component

**Files:**
- Create: `frontend/src/components/GuestWarningModal.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PrimaryButton, GhostButton } from '@/components/ui/buttons'

interface GuestWarningModalProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function GuestWarningModal({ open, onConfirm, onCancel }: GuestWarningModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="bg-sl-black border border-amber-400/30 sm:max-w-sm shadow-[0_0_30px_rgba(251,191,36,0.15)]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <AlertTriangle size={20} className="text-amber-400 shrink-0" />
            <DialogTitle className="text-amber-400 font-bold uppercase tracking-wider">
              Guest Account
            </DialogTitle>
          </div>
          <DialogDescription asChild>
            <div className="text-sm space-y-2 pt-1">
              <p className="text-sl-silver-muted">
                Your progress is stored on <span className="text-sl-silver font-semibold">this device only</span>.
              </p>
              <p className="text-sl-silver-muted">
                If you clear your browser data or switch devices,{' '}
                <span className="text-amber-400 font-semibold">your account cannot be recovered</span>.
              </p>
              <p className="text-sl-silver-muted">
                You can link a Google account anytime from the menu to keep your progress safe.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 pt-2">
          <GhostButton onClick={onCancel} className="flex-1">
            Back
          </GhostButton>
          <PrimaryButton onClick={onConfirm} className="flex-1">
            Continue as Guest
          </PrimaryButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd frontend && npm run typecheck
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/GuestWarningModal.tsx
git commit -m "feat: add GuestWarningModal component"
```

---

## Task 8: Update LoginPage — Guest Button + Warning Modal

**Files:**
- Modify: `frontend/src/pages/LoginPage.tsx`

- [ ] **Step 1: Replace the full contents of `frontend/src/pages/LoginPage.tsx`**

```tsx
import { useState } from 'react'
import { Ghost } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import AppTitle from '@/components/AppTitle'
import GuestWarningModal from '@/components/GuestWarningModal'

export default function LoginPage() {
  const { login, loginAsGuest } = useAuth()
  const [showGuestWarning, setShowGuestWarning] = useState(false)

  const handleGuestConfirm = async () => {
    setShowGuestWarning(false)
    await loginAsGuest()
  }

  return (
    <div className="min-h-screen bg-sl-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-12 flex flex-col items-center">
          <AppTitle className="h-16 mb-4" />
          <p className="text-sl-silver-muted">Level up your productivity</p>
        </div>

        {/* Login Card */}
        <div className="bg-sl-gray border border-sl-gray-light rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-sl-silver text-center mb-2">
            Welcome back
          </h2>
          <p className="text-sl-silver-muted text-center text-sm mb-8">
            Sign in to continue to your dashboard
          </p>

          {/* Google Login Button */}
          <button
            onClick={login}
            className="w-full flex items-center justify-center gap-3 bg-sl-blue hover:bg-sl-blue-dark border border-sl-blue text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 glow-blue"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative flex items-center my-6">
            <div className="flex-1 border-t border-sl-gray-light" />
            <span className="px-3 text-xs text-sl-silver-dark">or</span>
            <div className="flex-1 border-t border-sl-gray-light" />
          </div>

          {/* Guest Login Button */}
          <button
            onClick={() => setShowGuestWarning(true)}
            className="w-full flex items-center justify-center gap-3 border border-sl-gray-light text-sl-silver-muted hover:text-sl-silver hover:border-sl-silver/50 font-medium py-3 px-4 rounded-xl transition-all duration-200"
          >
            <Ghost size={18} />
            Continue as Guest
          </button>

          <p className="text-sl-silver-dark text-xs text-center mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>

        {/* Footer */}
        <p className="text-sl-silver-dark text-sm text-center mt-8">
          New here? Sign in to create your account automatically.
        </p>
      </div>

      <GuestWarningModal
        open={showGuestWarning}
        onConfirm={handleGuestConfirm}
        onCancel={() => setShowGuestWarning(false)}
      />
    </div>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd frontend && npm run typecheck
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/LoginPage.tsx
git commit -m "feat: add Play as Guest button and warning modal to LoginPage"
```

---

## Task 9: Update Header — Link Google Account for Guest Users

**Files:**
- Modify: `frontend/src/components/Header.tsx`

- [ ] **Step 1: Update the import line to add `Link` icon and `linkGoogleAccount` from useAuth**

Find this line in `Header.tsx`:
```typescript
import { Menu, Trophy, Target, LogOut, ChevronLeft, ChevronRight, BarChart3, Crown, Swords, Shield, Flame, Star, Sparkles, Zap } from "lucide-react";
```

Replace with:
```typescript
import { Menu, Trophy, Target, LogOut, ChevronLeft, ChevronRight, BarChart3, Crown, Swords, Shield, Flame, Star, Sparkles, Zap, Link } from "lucide-react";
```

- [ ] **Step 2: Update the `useAuth` destructure to include `linkGoogleAccount` and `isGuest`**

Find:
```typescript
  const { user, logout } = useAuth();
```

Replace with:
```typescript
  const { user, logout, linkGoogleAccount, isGuest } = useAuth();
```

- [ ] **Step 3: Add the "Link Google Account" menu item — insert it in the dropdown just before the Logout item**

Find this block in the JSX:
```tsx
              <DropdownMenuSeparator className="bg-sl-gray-muted" />
              <DropdownMenuItem
                onClick={() => setShowLogoutModal(true)}
                className="text-sl-red hover:text-sl-red hover:bg-sl-red/5 cursor-pointer text-xs font-bold uppercase tracking-wider"
              >
                <LogOut size={16} />
                Logout
              </DropdownMenuItem>
```

Replace with:
```tsx
              <DropdownMenuSeparator className="bg-sl-gray-muted" />
              {isGuest && (
                <>
                  <DropdownMenuItem
                    onClick={linkGoogleAccount}
                    className="text-amber-400 hover:text-amber-400 hover:bg-amber-400/5 cursor-pointer text-xs font-bold uppercase tracking-wider"
                  >
                    <Link size={16} />
                    Link Google Account
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-sl-gray-muted" />
                </>
              )}
              <DropdownMenuItem
                onClick={() => setShowLogoutModal(true)}
                className="text-sl-red hover:text-sl-red hover:bg-sl-red/5 cursor-pointer text-xs font-bold uppercase tracking-wider"
              >
                <LogOut size={16} />
                Logout
              </DropdownMenuItem>
```

- [ ] **Step 4: Run TypeScript + lint check**

```bash
cd frontend && npm run check
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/Header.tsx
git commit -m "feat: add Link Google Account option in header dropdown for guest users"
```

---

## Final Verification

- [ ] **Step 1: Start the full stack**

```bash
# Terminal 1
cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000

# Terminal 2
cd frontend && npm run dev
```

- [ ] **Step 2: Test guest login flow**

1. Open http://localhost:5173
2. Click "Continue as Guest" — warning modal appears
3. Click "Back" — modal closes, still on login page
4. Click "Continue as Guest" again → "Continue as Guest" in modal — redirected to calendar
5. Confirm the header shows the guest user name (e.g. "Guest #4821") with level 1

- [ ] **Step 3: Test Link Google Account flow**

1. As a guest, open the hamburger menu in the header
2. Confirm "Link Google Account" item appears in amber
3. Click it — redirected to Google OAuth
4. Complete Google sign-in
5. Confirm redirect back to app, user name updates to Google name, "Link Google Account" no longer appears in menu

- [ ] **Step 4: Test guest token persistence**

1. Log in as guest
2. Refresh the page — confirm still logged in (token in localStorage persists)

- [ ] **Step 5: Run frontend checks one final time**

```bash
cd frontend && npm run check
```

Expected: No errors.
