from sqlalchemy import Column, String, DateTime, Text, Float, JSON, Boolean, Integer
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class SoftwareType(Base):
    __tablename__ = "software_types"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    display_name = Column(String, nullable=True)  # Nom d'affichage
    description = Column(Text, nullable=True)
    category = Column(String, nullable=True)  # IAM, PAM, SSO, etc.
    base_price_per_hour = Column(Float, nullable=False, default=0.0)
    is_active = Column(String, default="true", nullable=False)  # Garder en String pour compatibilité
    default_version = Column(String, nullable=True)  # Version par défaut
    supported_versions = Column(JSON, nullable=True)  # Liste des versions supportées
    docker_image = Column(String, nullable=True)  # Image Docker par défaut
    default_port = Column(Integer, nullable=True)  # Port par défaut
    access_url_pattern = Column(String, nullable=True)  # Pattern d'URL d'accès
    admin_username = Column(String, nullable=True)  # Nom d'utilisateur admin par défaut
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship - one-to-many avec Sandbox
    sandboxes = relationship("Sandbox", back_populates="software_type")
    
    @property
    def is_active_bool(self) -> bool:
        """Propriété pour convertir is_active en booléen"""
        return self.is_active.lower() == "true" 