from sqlalchemy import Column, String, DateTime, Float, Integer, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Pricing(Base):
    __tablename__ = "pricing"

    id = Column(String, primary_key=True, index=True)
    software_type_id = Column(String, ForeignKey("software_types.id"), nullable=False)
    duration_hours = Column(Integer, nullable=False)  # 1, 2, 4, 8, 24, etc.
    price = Column(Float, nullable=False)
    is_active = Column(String, default="true", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship
    software_type = relationship("SoftwareType") 