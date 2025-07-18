from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProjectBase(BaseModel):
    name: str

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None

class Project(ProjectBase):
    id: str
    creator_id: str
    created_at: datetime
    updated_at: datetime
    torisetsu_count: Optional[int] = None
    
    class Config:
        from_attributes = True