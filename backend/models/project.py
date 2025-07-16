from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from database import Base

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    creator_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # リレーション
    creator = relationship("User", back_populates="projects")
    manuals = relationship("Manual", back_populates="project", cascade="all, delete-orphan")