from sqlalchemy import Column, String, DateTime, Text, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class SoftwareType(Base):
    __tablename__ = "software_types"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    base_price_per_hour = Column(Float, nullable=False, default=0.0)
    is_active = Column(String, default="true", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship - one-to-many avec Sandbox
    sandboxes = relationship("Sandbox", back_populates="software_type") 