from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Annotated
import json
import logging
import os
import secrets
from datetime import datetime, timedelta

from database import get_db
from models import User, Manual, Project, Torisetsu
from schemas import ManualCreate, ManualUpdate, Manual as ManualSchema, ShareTokenRequest, ShareTokenResponse
from routers.auth import get_current_user
from services.gemini_service import gemini_service

logger = logging.getLogger(__name__)

router = APIRouter()

def check_torisetsu_access(torisetsu_id: str, user_id: str, db: Session) -> bool:
    torisetsu = db.query(Torisetsu).filter(Torisetsu.id == torisetsu_id).first()
    if not torisetsu:
        return False
    
    # プロジェクトの作成者かどうかをチェック
    project = db.query(Project).filter(Project.id == torisetsu.project_id).first()
    if not project:
        return False
    
    return project.creator_id == user_id

@router.post("/", response_model=ManualSchema)
async def create_manual(
    manual: ManualCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    # トリセツへのアクセス権限チェック
    if not check_torisetsu_access(manual.torisetsu_id, current_user.id, db):
        raise HTTPException(status_code=403, detail="Not authorized to create manual in this torisetsu")
    
    # contentをJSON文字列に変換
    content_str = json.dumps(manual.content) if manual.content else None
    
    db_manual = Manual(
        torisetsu_id=manual.torisetsu_id,
        title=manual.title,
        content=content_str,
        status=manual.status,
        version=manual.version,
        video_file_path=manual.video_file_path
    )
    db.add(db_manual)
    db.commit()
    db.refresh(db_manual)
    
    # contentをJSONに戻す
    if db_manual.content:
        db_manual.content = json.loads(db_manual.content)
    
    return db_manual

@router.get("/torisetsu/{torisetsu_id}", response_model=List[ManualSchema])
async def list_manuals_by_torisetsu(
    torisetsu_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    # トリセツへのアクセス権限チェック
    if not check_torisetsu_access(torisetsu_id, current_user.id, db):
        raise HTTPException(status_code=403, detail="Not authorized to access this torisetsu")
    
    manuals = db.query(Manual).filter(Manual.torisetsu_id == torisetsu_id).order_by(Manual.created_at.desc()).all()
    
    # contentをJSONに変換
    for manual in manuals:
        if manual.content:
            manual.content = json.loads(manual.content)
    
    return manuals

@router.get("/detail/{manual_id}", response_model=ManualSchema)
async def get_manual_detail(
    manual_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    manual = db.query(Manual).filter(Manual.id == manual_id).first()
    if not manual:
        raise HTTPException(status_code=404, detail="Manual not found")
    
    # トリセツへのアクセス権限チェック
    if not check_torisetsu_access(manual.torisetsu_id, current_user.id, db):
        raise HTTPException(status_code=403, detail="Not authorized to access this manual")
    
    # contentをJSONに変換
    if manual.content:
        manual.content = json.loads(manual.content)
    
    return manual


@router.put("/{manual_id}", response_model=ManualSchema)
async def update_manual(
    manual_id: str,
    manual_update: ManualUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    manual = db.query(Manual).filter(Manual.id == manual_id).first()
    if not manual:
        raise HTTPException(status_code=404, detail="Manual not found")
    
    # トリセツへのアクセス権限チェック
    if not check_torisetsu_access(manual.torisetsu_id, current_user.id, db):
        raise HTTPException(status_code=403, detail="Not authorized to update this manual")
    
    update_data = manual_update.dict(exclude_unset=True)
    
    # contentをJSON文字列に変換
    if "content" in update_data and update_data["content"] is not None:
        update_data["content"] = json.dumps(update_data["content"])
    
    for field, value in update_data.items():
        setattr(manual, field, value)
    
    db.commit()
    db.refresh(manual)
    
    # contentをJSONに戻す
    if manual.content:
        manual.content = json.loads(manual.content)
    
    return manual

@router.delete("/{manual_id}")
async def delete_manual(
    manual_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    manual = db.query(Manual).filter(Manual.id == manual_id).first()
    if not manual:
        raise HTTPException(status_code=404, detail="Manual not found")
    
    # トリセツへのアクセス権限チェック
    if not check_torisetsu_access(manual.torisetsu_id, current_user.id, db):
        raise HTTPException(status_code=403, detail="Not authorized to delete this manual")
    
    db.delete(manual)
    db.commit()
    
    return {"message": "Manual deleted successfully"}

async def generate_manual_background(manual_id: str, db: Session):
    """Background task for manual generation"""
    try:
        manual = db.query(Manual).filter(Manual.id == manual_id).first()
        if not manual:
            logger.error(f"Manual {manual_id} not found for background generation")
            return
        
        # Update status to processing
        manual.status = "processing"
        db.commit()
        
        # Check if video file exists
        if not manual.video_file_path or not os.path.exists(manual.video_file_path):
            manual.status = "failed"
            db.commit()
            logger.error(f"Video file not found for manual {manual_id}: {manual.video_file_path}")
            return
        
        # Generate manual using Gemini
        logger.info(f"Starting manual generation for manual {manual_id}")
        generated_content = await gemini_service.generate_manual_from_video(
            video_path=manual.video_file_path,
            title=manual.title or "操作マニュアル",
            language="ja"
        )
        
        # Update manual with generated content
        manual.content = json.dumps(generated_content)
        manual.status = "completed"
        db.commit()
        
        logger.info(f"Manual generation completed for manual {manual_id}")
        
    except Exception as e:
        logger.error(f"Failed to generate manual {manual_id}: {str(e)}")
        # Update status to failed with error details
        manual = db.query(Manual).filter(Manual.id == manual_id).first()
        if manual:
            manual.status = "failed"
            # Store error information for debugging
            error_info = {
                "error_type": type(e).__name__,
                "error_message": str(e),
                "is_network_error": "DNS resolution failed" in str(e) or "ServiceUnavailable" in str(e) or "503" in str(e)
            }
            # You could store this in a separate error log table if needed
            logger.error(f"Manual {manual_id} generation failed: {error_info}")
            db.commit()

@router.post("/{manual_id}/generate")
async def generate_manual_content(
    manual_id: str,
    background_tasks: BackgroundTasks,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """Start manual generation from video using Gemini API"""
    manual = db.query(Manual).filter(Manual.id == manual_id).first()
    if not manual:
        raise HTTPException(status_code=404, detail="Manual not found")
    
    # トリセツへのアクセス権限チェック
    if not check_torisetsu_access(manual.torisetsu_id, current_user.id, db):
        raise HTTPException(status_code=403, detail="Not authorized to generate content for this manual")
    
    if not manual.video_file_path:
        raise HTTPException(status_code=400, detail="No video file associated with this manual")
    
    # Check if video file exists
    if not os.path.exists(manual.video_file_path):
        raise HTTPException(status_code=400, detail="Video file not found on server")
    
    # Check if Gemini API key is configured
    try:
        if not gemini_service.api_key:
            raise HTTPException(status_code=500, detail="Gemini API key not configured")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini service error: {str(e)}")
    
    # Start background task for manual generation
    background_tasks.add_task(generate_manual_background, manual_id, db)
    
    # Update status to processing
    manual.status = "processing"
    db.commit()
    
    return {
        "message": "Manual generation started",
        "manual_id": manual_id,
        "status": "processing"
    }

@router.post("/{manual_id}/enhance")
async def enhance_manual_content(
    manual_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    enhancement_type: str = "improve"
):
    """Enhance existing manual content using Gemini API"""
    manual = db.query(Manual).filter(Manual.id == manual_id).first()
    if not manual:
        raise HTTPException(status_code=404, detail="Manual not found")
    
    # トリセツへのアクセス権限チェック
    if not check_torisetsu_access(manual.torisetsu_id, current_user.id, db):
        raise HTTPException(status_code=403, detail="Not authorized to enhance this manual")
    
    if not manual.content:
        raise HTTPException(status_code=400, detail="No content to enhance")
    
    try:
        # Get current content
        current_content = manual.content
        if isinstance(current_content, str):
            content_data = json.loads(current_content)
            # Extract raw content for enhancement
            raw_content = content_data.get("raw_content", current_content)
        else:
            raw_content = str(current_content)
        
        # Enhance content using Gemini
        enhanced_content = await gemini_service.enhance_manual_content(
            manual_content=raw_content,
            enhancement_type=enhancement_type
        )
        
        # Update manual with enhanced content
        if isinstance(current_content, str):
            content_data = json.loads(current_content)
            content_data["enhanced_content"] = enhanced_content
            content_data["enhancement_type"] = enhancement_type
            manual.content = json.dumps(content_data)
        else:
            manual.content = json.dumps({
                "enhanced_content": enhanced_content,
                "enhancement_type": enhancement_type,
                "original_content": raw_content
            })
        
        db.commit()
        
        return {
            "message": "Manual enhancement completed",
            "manual_id": manual_id,
            "enhancement_type": enhancement_type,
            "enhanced_content": enhanced_content
        }
        
    except Exception as e:
        logger.error(f"Failed to enhance manual {manual_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to enhance manual: {str(e)}")

@router.get("/{manual_id}/status")
async def get_manual_status(
    manual_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """Get the current status of manual generation"""
    manual = db.query(Manual).filter(Manual.id == manual_id).first()
    if not manual:
        raise HTTPException(status_code=404, detail="Manual not found")
    
    # トリセツへのアクセス権限チェック
    if not check_torisetsu_access(manual.torisetsu_id, current_user.id, db):
        raise HTTPException(status_code=403, detail="Not authorized to access this manual")
    
    return {
        "manual_id": manual_id,
        "status": manual.status,
        "title": manual.title,
        "has_content": bool(manual.content),
        "video_file_path": manual.video_file_path
    }

@router.post("/{manual_id}/share", response_model=ShareTokenResponse)
async def create_share_token(
    manual_id: str,
    share_request: ShareTokenRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """Create a share token for public access to manual playback"""
    manual = db.query(Manual).filter(Manual.id == manual_id).first()
    if not manual:
        raise HTTPException(status_code=404, detail="Manual not found")
    
    # トリセツへのアクセス権限チェック
    if not check_torisetsu_access(manual.torisetsu_id, current_user.id, db):
        raise HTTPException(status_code=403, detail="Not authorized to share this manual")
    
    # Generate secure token
    share_token = secrets.token_urlsafe(32)
    
    # Set expiration
    expires_at = None
    if share_request.expires_in_days:
        expires_at = datetime.utcnow() + timedelta(days=share_request.expires_in_days)
    
    # Update manual with share token
    manual.share_token = share_token
    manual.share_enabled = True
    manual.share_expires_at = expires_at
    
    db.commit()
    
    # Create share URL
    share_url = f"/share/{share_token}"
    
    return ShareTokenResponse(
        share_token=share_token,
        share_url=share_url,
        expires_at=expires_at
    )

@router.delete("/{manual_id}/share")
async def disable_share(
    manual_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """Disable sharing for a manual"""
    manual = db.query(Manual).filter(Manual.id == manual_id).first()
    if not manual:
        raise HTTPException(status_code=404, detail="Manual not found")
    
    # トリセツへのアクセス権限チェック
    if not check_torisetsu_access(manual.torisetsu_id, current_user.id, db):
        raise HTTPException(status_code=403, detail="Not authorized to modify sharing for this manual")
    
    # Disable sharing
    manual.share_enabled = False
    manual.share_token = None
    manual.share_expires_at = None
    
    db.commit()
    
    return {"message": "Sharing disabled successfully"}

@router.get("/shared/{share_token}", response_model=ManualSchema)
async def get_shared_manual(
    share_token: str,
    db: Session = Depends(get_db)
):
    """Get manual by share token (no authentication required)"""
    manual = db.query(Manual).filter(
        Manual.share_token == share_token,
        Manual.share_enabled == True
    ).first()
    
    if not manual:
        raise HTTPException(status_code=404, detail="Shared manual not found")
    
    # Check if token has expired
    if manual.share_expires_at and manual.share_expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="Share link has expired")
    
    # contentをJSONに変換
    if manual.content:
        manual.content = json.loads(manual.content)
    
    return manual

@router.get("/health/network")
async def check_network_health():
    """Check network connectivity for Gemini API"""
    try:
        from services.gemini_service import gemini_service
        await gemini_service._check_network_connectivity()
        return {
            "status": "healthy",
            "message": "Network connectivity to Gemini API is working",
            "gemini_model": gemini_service.model_name
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "message": f"Network connectivity issue: {str(e)}",
            "error_type": type(e).__name__
        }