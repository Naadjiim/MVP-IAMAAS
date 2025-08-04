from sqlalchemy import Column, String, DateTime, Integer, Text, Enum, ForeignKey, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class SandboxStatus(str, enum.Enum):
    RUNNING = "running"
    STOPPED = "stopped"
    EXPIRED = "expired"

class SoftwareType(str, enum.Enum):
    keycloak = "keycloak"
    # Future: ldap = "ldap", active_directory = "active_directory", etc.

class Sandbox(Base):
    __tablename__ = "sandboxes"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(SandboxStatus), default=SandboxStatus.RUNNING)
    container_id = Column(String, nullable=True)
    access_url = Column(String, nullable=True)
    admin_username = Column(String, nullable=True)
    admin_password = Column(String, nullable=True)
    software_type = Column(Enum(SoftwareType), default=SoftwareType.keycloak, nullable=False)
    price = Column(Float, nullable=False, default=0.0)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    duration_hours = Column(Integer, nullable=False)
    
    # Relationship
    user = relationship("User", back_populates="sandboxes") 