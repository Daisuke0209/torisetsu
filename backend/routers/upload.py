from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import Annotated
import os
import uuid
import shutil

from database import get_db
from models import User
from routers.auth import get_current_user
from config import settings

router = APIRouter()

ALLOWED_VIDEO_EXTENSIONS = {".webm", ".mp4", ".avi", ".mov"}
ALLOWED_AUDIO_EXTENSIONS = {".mp3", ".wav", ".m4a", ".ogg", ".webm", ".aac"}

def validate_video_file(filename: str) -> bool:
    ext = os.path.splitext(filename)[1].lower()
    return ext in ALLOWED_VIDEO_EXTENSIONS

def validate_audio_file(filename: str) -> bool:
    ext = os.path.splitext(filename)[1].lower()
    return ext in ALLOWED_AUDIO_EXTENSIONS

@router.post("/video")
async def upload_video(
    file: UploadFile = File(...),
    current_user: Annotated[User, Depends(get_current_user)] = None,
    db: Session = Depends(get_db)
):
    # ファイルサイズチェック
    file_size = 0
    contents = await file.read()
    file_size = len(contents)
    await file.seek(0)  # ファイルポインタを先頭に戻す
    
    if file_size > settings.max_file_size:
        raise HTTPException(
            status_code=413,
            detail=f"File size exceeds maximum allowed size of {settings.max_file_size / 1024 / 1024}MB"
        )
    
    # ファイル形式チェック
    if not validate_video_file(file.filename):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_VIDEO_EXTENSIONS)}"
        )
    
    # ユニークなファイル名を生成
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(settings.upload_folder, unique_filename)
    
    # ファイルを保存
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save file: {str(e)}"
        )
    finally:
        await file.close()
    
    return {
        "filename": unique_filename,
        "file_path": file_path,
        "original_filename": file.filename,
        "file_size": file_size
    }

@router.post("/audio")
async def upload_audio(
    file: UploadFile = File(...),
    current_user: Annotated[User, Depends(get_current_user)] = None,
    db: Session = Depends(get_db)
):
    # ファイルサイズチェック（音声は10MBまで）
    file_size = 0
    contents = await file.read()
    file_size = len(contents)
    await file.seek(0)  # ファイルポインタを先頭に戻す
    
    max_audio_size = 10 * 1024 * 1024  # 10MB
    if file_size > max_audio_size:
        raise HTTPException(
            status_code=413,
            detail=f"Audio file size exceeds maximum allowed size of 10MB"
        )
    
    # ファイル形式チェック
    if not validate_audio_file(file.filename):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid audio file type. Allowed types: {', '.join(ALLOWED_AUDIO_EXTENSIONS)}"
        )
    
    # ユニークなファイル名を生成
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"audio_{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(settings.upload_folder, unique_filename)
    
    # ファイルを保存
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save audio file: {str(e)}"
        )
    finally:
        await file.close()
    
    return {
        "filename": unique_filename,
        "file_path": file_path,
        "original_filename": file.filename,
        "file_size": file_size
    }