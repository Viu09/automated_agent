from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.user import User
from app.db.models.user_preference import UserPreference
from app.schemas.user_preference import UserPreferenceRead, UserPreferenceUpsert


class UserPreferenceService:
    def __init__(self, db: Session):
        self.db = db

    def get_for_user(self, user: User) -> UserPreferenceRead | None:
        item = self.db.scalar(select(UserPreference).where(UserPreference.user_id == user.id))
        if item is None:
            return None
        return self._to_read(item)

    def upsert(self, user: User, payload: UserPreferenceUpsert) -> UserPreferenceRead:
        item = self.db.scalar(select(UserPreference).where(UserPreference.user_id == user.id))
        if item is None:
            item = UserPreference(user_id=user.id, preferences=payload.preferences)
            self.db.add(item)
        else:
            item.preferences = payload.preferences
        self.db.commit()
        self.db.refresh(item)
        return self._to_read(item)

    @staticmethod
    def _to_read(item: UserPreference) -> UserPreferenceRead:
        return UserPreferenceRead.model_validate(
            {
                "id": item.id,
                "preferences": item.preferences,
                "updated_at": item.updated_at,
            }
        )
