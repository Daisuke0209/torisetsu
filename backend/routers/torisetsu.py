from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from database import get_db
from models import Torisetsu, Manual, Project
from schemas.torisetsu import TorisetsuCreate, TorisetsuUpdate, TorisetsuResponse, TorisetsuDetail
from routers.auth import get_current_user
from models.user import User

router = APIRouter(tags=["torisetsu"])

@router.get("/project/{project_id}", response_model=List[TorisetsuResponse])
def get_torisetsu_by_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """プロジェクト内のトリセツ一覧を取得"""
    # プロジェクトのアクセス権限チェック
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="プロジェクトが見つかりません"
        )
    
    if project.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="このプロジェクトにアクセスする権限がありません"
        )
    
    # トリセツ一覧を取得（マニュアル数も含める）
    torisetsu_list = db.query(
        Torisetsu,
        func.count(Manual.id).label("manual_count")
    ).outerjoin(Manual).filter(
        Torisetsu.project_id == project_id
    ).group_by(Torisetsu.id).order_by(Torisetsu.created_at.desc()).all()
    
    result = []
    for torisetsu, manual_count in torisetsu_list:
        torisetsu_dict = {
            "id": torisetsu.id,
            "project_id": torisetsu.project_id,
            "name": torisetsu.name,
            "created_at": torisetsu.created_at,
            "updated_at": torisetsu.updated_at,
            "manual_count": manual_count
        }
        result.append(TorisetsuResponse(**torisetsu_dict))
    
    return result

@router.get("/detail/{torisetsu_id}", response_model=TorisetsuDetail)
def get_torisetsu_detail(
    torisetsu_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """トリセツの詳細情報を取得"""
    torisetsu = db.query(Torisetsu).filter(Torisetsu.id == torisetsu_id).first()
    if not torisetsu:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="トリセツが見つかりません"
        )
    
    # プロジェクトのアクセス権限チェック
    project = db.query(Project).filter(Project.id == torisetsu.project_id).first()
    if not project or project.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="このトリセツにアクセスする権限がありません"
        )
    
    # マニュアル数を取得
    manual_count = db.query(func.count(Manual.id)).filter(
        Manual.torisetsu_id == torisetsu_id
    ).scalar()
    
    torisetsu_dict = {
        "id": torisetsu.id,
        "project_id": torisetsu.project_id,
        "name": torisetsu.name,
        "created_at": torisetsu.created_at,
        "updated_at": torisetsu.updated_at,
        "manual_count": manual_count
    }
    
    return TorisetsuDetail(**torisetsu_dict)

@router.post("/", response_model=TorisetsuResponse)
def create_torisetsu(
    torisetsu: TorisetsuCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """トリセツを作成"""
    # プロジェクトのアクセス権限チェック
    project = db.query(Project).filter(Project.id == torisetsu.project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="プロジェクトが見つかりません"
        )
    
    if project.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="このプロジェクトにアクセスする権限がありません"
        )
    
    db_torisetsu = Torisetsu(
        project_id=torisetsu.project_id,
        name=torisetsu.name
    )
    db.add(db_torisetsu)
    db.commit()
    db.refresh(db_torisetsu)
    
    torisetsu_dict = {
        "id": db_torisetsu.id,
        "project_id": db_torisetsu.project_id,
        "name": db_torisetsu.name,
        "created_at": db_torisetsu.created_at,
        "updated_at": db_torisetsu.updated_at,
        "manual_count": 0
    }
    
    return TorisetsuResponse(**torisetsu_dict)

@router.put("/{torisetsu_id}", response_model=TorisetsuResponse)
def update_torisetsu(
    torisetsu_id: str,
    torisetsu_update: TorisetsuUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """トリセツを更新"""
    torisetsu = db.query(Torisetsu).filter(Torisetsu.id == torisetsu_id).first()
    if not torisetsu:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="トリセツが見つかりません"
        )
    
    # プロジェクトのアクセス権限チェック
    project = db.query(Project).filter(Project.id == torisetsu.project_id).first()
    if not project or project.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="このトリセツを更新する権限がありません"
        )
    
    # 更新
    torisetsu.name = torisetsu_update.name
    db.commit()
    db.refresh(torisetsu)
    
    # マニュアル数を取得
    manual_count = db.query(func.count(Manual.id)).filter(
        Manual.torisetsu_id == torisetsu_id
    ).scalar()
    
    torisetsu_dict = {
        "id": torisetsu.id,
        "project_id": torisetsu.project_id,
        "name": torisetsu.name,
        "created_at": torisetsu.created_at,
        "updated_at": torisetsu.updated_at,
        "manual_count": manual_count
    }
    
    return TorisetsuResponse(**torisetsu_dict)

@router.delete("/{torisetsu_id}")
def delete_torisetsu(
    torisetsu_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """トリセツを削除（カスケード削除でマニュアルも削除）"""
    torisetsu = db.query(Torisetsu).filter(Torisetsu.id == torisetsu_id).first()
    if not torisetsu:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="トリセツが見つかりません"
        )
    
    # プロジェクトのアクセス権限チェック
    project = db.query(Project).filter(Project.id == torisetsu.project_id).first()
    if not project or project.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="このトリセツを削除する権限がありません"
        )
    
    db.delete(torisetsu)
    db.commit()
    
    return {"message": "トリセツが削除されました"}