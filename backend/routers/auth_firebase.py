from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any
import logging

from database import get_db
from models.user import User
from schemas.user import User as UserSchema
from schemas.auth import Token
from utils.firebase_config import verify_firebase_token, get_or_create_firebase_user
from utils.auth import create_access_token
from datetime import timedelta
from config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/google", response_model=Token)
async def google_login(token_data: Dict[str, Any], db: Session = Depends(get_db)):
    """Googleログイン処理"""
    try:
        # リクエストボディからIDトークンを取得
        id_token = token_data.get("idToken")
        if not id_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="IDトークンが必要です"
            )
        
        # Firebase IDトークンを検証
        firebase_user = verify_firebase_token(id_token)
        if not firebase_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="無効な認証トークンです"
            )
        
        # ユーザー情報を取得
        user_info = get_or_create_firebase_user(firebase_user)
        
        # データベースでユーザーを検索（Firebase UIDまたはメールアドレスで）
        user = db.query(User).filter(
            (User.firebase_uid == user_info['uid']) | (User.email == user_info['email'])
        ).first()
        
        if not user:
            # 新規ユーザーの場合は作成
            user = User(
                firebase_uid=user_info['uid'],
                email=user_info['email'],
                username=user_info['display_name'] or user_info['email'].split('@')[0],
                photo_url=user_info['photo_url'],
                # Googleログインの場合、パスワードは不要
                hashed_password="",
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info(f"New user created: {user.email}")
        else:
            # 既存ユーザーの情報を更新（Firebase UIDが未設定の場合は設定）
            if not user.firebase_uid:
                user.firebase_uid = user_info['uid']
            user.email = user_info['email']
            user.username = user_info['display_name'] or user.username
            user.photo_url = user_info['photo_url']
            db.commit()
            logger.info(f"User updated: {user.email}")
        
        # JWTトークンを生成
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = create_access_token(
            data={"sub": user.firebase_uid, "email": user.email},
            expires_delta=access_token_expires
        )
        
        return {"access_token": access_token, "token_type": "bearer"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ログイン処理中にエラーが発生しました"
        )