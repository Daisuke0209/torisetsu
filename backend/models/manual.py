from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from database import Base

class Manual(Base):
    __tablename__ = "manuals"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    torisetsu_id = Column(String, ForeignKey("torisetsu.id"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text)  # JSON形式で保存
    status = Column(String, default="draft")  # Stringとして処理
    version = Column(String, default="1.0")
    video_file_path = Column(String)
    audio_file_path = Column(String)
    share_token = Column(String, index=True, nullable=True)
    share_enabled = Column(Boolean, default=False, nullable=False)
    share_expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # リレーション
    torisetsu = relationship("Torisetsu", back_populates="manuals")