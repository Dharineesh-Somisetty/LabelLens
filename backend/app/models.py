"""LabelLens – SQLAlchemy ORM models."""

from __future__ import annotations
from sqlalchemy import Column, String, Text, DateTime, func
from .database import Base


class Session(Base):
    __tablename__ = "sessions"

    session_id = Column(String, primary_key=True, index=True)
    created_at = Column(DateTime, server_default=func.now())
    product_json = Column(Text, default="{}")
    analysis_json = Column(Text, default="{}")
    user_profile_json = Column(Text, default="{}")

