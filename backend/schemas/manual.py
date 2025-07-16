from pydantic import BaseModel
from typing import Optional, Dict, Any, Literal
from datetime import datetime

# Valid status values that match the database enum
ManualStatusType = Literal["draft", "processing", "completed", "failed", "review", "published"]

class ManualBase(BaseModel):
    title: str
    content: Optional[Dict[str, Any]] = None
    status: ManualStatusType = "draft"
    version: str = "1.0"

class ManualCreate(ManualBase):
    project_id: str
    video_file_path: Optional[str] = None
    audio_file_path: Optional[str] = None

class ManualUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[Dict[str, Any]] = None
    status: Optional[ManualStatusType] = None
    version: Optional[str] = None
    audio_file_path: Optional[str] = None

class Manual(ManualBase):
    id: str
    project_id: str
    video_file_path: Optional[str] = None
    audio_file_path: Optional[str] = None
    share_token: Optional[str] = None
    share_enabled: bool = False
    share_expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ShareTokenRequest(BaseModel):
    expires_in_days: Optional[int] = 7  # Default 7 days

class ShareTokenResponse(BaseModel):
    share_token: str
    share_url: str
    expires_at: Optional[datetime] = None