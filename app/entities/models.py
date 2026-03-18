# app/entities/models.py
from sqlalchemy import Column, Integer, String, DateTime, text
from sqlalchemy.dialects.postgresql import JSONB, INTERVAL
from sqlalchemy.sql import func
from app.database import Base


class ScanJob(Base):
    __tablename__ = "scan_jobs"

    id = Column(Integer, primary_key=True, index=True)
    target = Column(String, nullable=True)
    status = Column(String, server_default="pending")
    config = Column(JSONB, server_default=text("'{}'::jsonb"))
    duration = Column(INTERVAL, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())