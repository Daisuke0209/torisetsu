from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Annotated

from database import get_db
from models import User, Project, Manual, Torisetsu
from schemas import ProjectCreate, ProjectUpdate, Project as ProjectSchema
from routers.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=ProjectSchema)
async def create_project(
    project: ProjectCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    db_project = Project(
        creator_id=current_user.id,
        name=project.name
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    
    return db_project

@router.get("/", response_model=List[ProjectSchema])
async def list_projects(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    projects = db.query(Project).filter(Project.creator_id == current_user.id).all()
    
    # 各プロジェクトのトリセツ数を取得
    for project in projects:
        torisetsu_count = db.query(Torisetsu).filter(Torisetsu.project_id == project.id).count()
        project.torisetsu_count = torisetsu_count
    
    return projects

@router.get("/detail/{project_id}", response_model=ProjectSchema)
async def get_project(
    project_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.creator_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # トリセツ数を取得
    torisetsu_count = db.query(Torisetsu).filter(Torisetsu.project_id == project.id).count()
    project.torisetsu_count = torisetsu_count
    
    return project

@router.put("/{project_id}", response_model=ProjectSchema)
async def update_project(
    project_id: str,
    project_update: ProjectUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.creator_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    update_data = project_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)
    
    db.commit()
    db.refresh(project)
    
    return project

@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    from sqlalchemy import text
    
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.creator_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # 関連するマニュアルとトリセツをRaw SQLで削除（enum変換エラーを回避）
    # 正しい削除順序: 1. マニュアル 2. トリセツ 3. プロジェクト
    db.execute(text("DELETE FROM manuals WHERE torisetsu_id IN (SELECT id FROM torisetsu WHERE project_id = :project_id)"), {"project_id": project_id})
    db.execute(text("DELETE FROM torisetsu WHERE project_id = :project_id"), {"project_id": project_id})
    
    # プロジェクトを削除
    db.delete(project)
    db.commit()
    
    return {"message": "Project deleted successfully"}