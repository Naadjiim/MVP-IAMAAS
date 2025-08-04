from sqlalchemy import Column, String, DateTime, Integer, Text, ForeignKey, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Sandbox(Base):
    __tablename__ = "sandboxes"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default="running", nullable=False)  # running, stopped, expired
    container_id = Column(String, nullable=True)
    access_url = Column(String, nullable=True)
    admin_username = Column(String, nullable=True)
    admin_password = Column(String, nullable=True)
    price = Column(Float, nullable=False, default=0.0)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    software_type_id = Column(String, ForeignKey("software_types.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    duration_hours = Column(Integer, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="sandboxes")
    software_type = relationship("SoftwareType", back_populates="sandboxes") 