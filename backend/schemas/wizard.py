from pydantic import BaseModel, Field
from typing import Optional

class WizardSetupRequest(BaseModel):
    project_name: str = Field(..., min_length=1, max_length=100, description="プロジェクト名")
    torisetsu_name: str = Field(..., min_length=1, max_length=100, description="トリセツ名")
    
class WizardSetupResponse(BaseModel):
    project_id: str
    torisetsu_id: str
    project_name: str
    torisetsu_name: str
    message: str = "初期セットアップが完了しました"