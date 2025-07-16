from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class WorkspaceBase(BaseModel):
    name: str
    description: Optional[str] = None

class WorkspaceCreate(WorkspaceBase):
    pass

class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class Workspace(WorkspaceBase):
    id: str
    owner_id: str
    created_at: datetime
    updated_at: datetime
    member_ids: List[str] = []
    
    class Config:
        from_attributes = True