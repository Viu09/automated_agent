from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.db.models.user import User
from app.schemas.auth import AccessToken, UserCreate, UserLogin
from app.schemas.user import UserRead


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def register(self, payload: UserCreate) -> UserRead:
        existing = self.db.scalar(select(User).where(User.email == payload.email.lower()))
        if existing is not None:
            raise ValueError("A user with this email already exists.")

        user = User(
            email=payload.email.lower(),
            full_name=payload.full_name,
            password_hash=hash_password(payload.password),
            is_active=True,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return self._to_user_read(user)

    def login(self, payload: UserLogin) -> AccessToken:
        user = self.db.scalar(select(User).where(User.email == payload.email.lower()))
        if user is None or not verify_password(payload.password, user.password_hash):
            raise ValueError("Invalid email or password.")
        if not user.is_active:
            raise ValueError("This account is inactive.")
        return AccessToken(access_token=create_access_token(str(user.id)))

    @staticmethod
    def _to_user_read(user: User) -> UserRead:
        return UserRead.model_validate(
            {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "is_active": user.is_active,
                "created_at": user.created_at,
            }
        )
