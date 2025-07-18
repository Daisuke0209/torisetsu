from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TorisetsuBase(BaseModel):
    name: str

class TorisetsuCreate(TorisetsuBase):
    project_id: str

class TorisetsuUpdate(TorisetsuBase):
    pass

class TorisetsuResponse(TorisetsuBase):
    id: str
    project_id: str
    created_at: datetime
    updated_at: datetime
    manual_count: Optional[int] = 0
    
    class Config:
        from_attributes = True

class TorisetsuDetail(TorisetsuResponse):
    pass