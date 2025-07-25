from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Annotated

from database import get_db
from models.user import User
from schemas.user import User as UserSchema, UserStatus
from utils.auth import decode_access_token, logger
from config import settings
from models.project import Project

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    user_identifier: str = payload.get("sub")
    if user_identifier is None:
        raise credentials_exception
    
    # Firebase UIDまたはメールアドレスでユーザーを検索
    user = db.query(User).filter(
        (User.firebase_uid == user_identifier) | (User.email == user_identifier)
    ).first()
    if user is None:
        raise credentials_exception
    
    return user

@router.get("/me", response_model=UserSchema)
async def read_users_me(current_user: Annotated[User, Depends(get_current_user)]):
    return current_user

@router.get("/me/status", response_model=UserStatus)
async def get_user_status(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """ユーザーのプロジェクト保有状況を返す"""
    project_count = db.query(Project).filter(Project.creator_id == current_user.id).count()
    
    return UserStatus(
        has_project=project_count > 0,
        project_count=project_count
    )