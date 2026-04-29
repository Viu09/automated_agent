from fastapi import APIRouter, Depends
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.user import UserRead
from app.schemas.user_preference import UserPreferenceRead, UserPreferenceUpsert
from app.services.user_preference_service import UserPreferenceService

router = APIRouter()


@router.get("/me", response_model=UserRead)
async def get_me(current_user: User = Depends(get_current_user)) -> UserRead:
    return UserRead.model_validate(
        {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "is_active": current_user.is_active,
            "created_at": current_user.created_at,
        }
    )


@router.get("/preferences", response_model=UserPreferenceRead | None)
async def get_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserPreferenceRead | None:
    return UserPreferenceService(db).get_for_user(current_user)


@router.put("/preferences", response_model=UserPreferenceRead)
async def upsert_preferences(
    payload: UserPreferenceUpsert,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserPreferenceRead:
    try:
        return UserPreferenceService(db).upsert(current_user, payload)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
