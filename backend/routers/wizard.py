from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Annotated
from datetime import datetime

from database import get_db
from models.user import User
from models.project import Project
from models.torisetsu import Torisetsu
from schemas.wizard import WizardSetupRequest, WizardSetupResponse
from routers.auth import get_current_user

router = APIRouter()

@router.post("/setup", response_model=WizardSetupResponse)
async def setup_wizard(
    setup_data: WizardSetupRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """
    初回ログインユーザー向けのウィザードセットアップ
    プロジェクトとトリセツを同時に作成
    """
    # 既にプロジェクトがある場合はエラー
    existing_project_count = db.query(Project).filter(Project.creator_id == current_user.id).count()
    if existing_project_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="すでにプロジェクトが存在します。ウィザードは初回ユーザー向けです。"
        )
    
    try:
        # プロジェクトを作成
        project = Project(
            creator_id=current_user.id,
            name=setup_data.project_name,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(project)
        db.flush()  # IDを取得するためにflush
        
        # トリセツを作成
        torisetsu = Torisetsu(
            project_id=project.id,
            name=setup_data.torisetsu_name,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(torisetsu)
        
        # データベースにコミット
        db.commit()
        
        return WizardSetupResponse(
            project_id=project.id,
            torisetsu_id=torisetsu.id,
            project_name=project.name,
            torisetsu_name=torisetsu.name
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"セットアップ中にエラーが発生しました: {str(e)}"
        )