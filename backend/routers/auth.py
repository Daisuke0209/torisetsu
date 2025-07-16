from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Annotated

from database import get_db
from models import User
from schemas import UserCreate, User as UserSchema, Token
from utils.auth import verify_password, get_password_hash, create_access_token, decode_access_token, logger
from config import settings

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
    
    # メールアドレスまたはユーザー名でユーザーを検索
    user = db.query(User).filter(
        (User.email == user_identifier) | (User.username == user_identifier)
    ).first()
    if user is None:
        raise credentials_exception
    
    return user

@router.post("/register", response_model=UserSchema)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    try:
        logger.info(f"Registration attempt: email={user.email}, username={user.username}")
        
        # 入力データのバリデーション
        email = user.email.strip().lower()
        username = user.username.strip()
        
        logger.info(f"Processed data: email={email}, username={username}, password_length={len(user.password)}")
        
        if not email or not username or not user.password:
            logger.warning("Missing required fields")
            raise HTTPException(
                status_code=400,
                detail="すべての必須フィールドを入力してください"
            )
        
        if len(user.password) < 8:
            logger.warning(f"Password too short: {len(user.password)} characters")
            raise HTTPException(
                status_code=400,
                detail="パスワードは8文字以上で入力してください"
            )
        
        # メールアドレスの重複チェック
        db_user = db.query(User).filter(User.email == email).first()
        if db_user:
            logger.warning(f"Email already exists: {email}")
            raise HTTPException(
                status_code=400,
                detail="このメールアドレスは既に登録されています"
            )
        
        # ユーザー名の重複チェックは削除（メールアドレスのみをユニークIDとする）
        
        # パスワードのハッシュ化
        hashed_password = get_password_hash(user.password)
        
        # ユーザー作成
        db_user = User(
            email=email,
            username=username,
            hashed_password=hashed_password
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        # ワークスペース機能は削除されたので、ユーザー作成のみ
        
        return db_user
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Registration error: {e}")
        raise HTTPException(
            status_code=500,
            detail="アカウント作成中にエラーが発生しました"
        )

@router.post("/token", response_model=Token)
async def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: Session = Depends(get_db)):
    try:
        # 入力データの検証
        username = form_data.username.strip()
        password = form_data.password
        
        if not username or not password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="メールアドレスとパスワードを入力してください"
            )
        
        # メールアドレスまたはユーザー名でユーザーを検索（大文字小文字を無視）
        user = db.query(User).filter(
            (User.email.ilike(username)) | (User.username == username)
        ).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="メールアドレスまたはパスワードが正しくありません",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # パスワード検証
        if not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="メールアドレスまたはパスワードが正しくありません",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # アクセストークン生成
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        
        logger.info(f"User {user.email} logged in successfully")
        
        return {"access_token": access_token, "token_type": "bearer"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ログイン処理中にエラーが発生しました"
        )

@router.get("/me", response_model=UserSchema)
async def read_users_me(current_user: Annotated[User, Depends(get_current_user)]):
    return current_user