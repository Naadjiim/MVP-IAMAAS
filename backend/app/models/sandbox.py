from sqlalchemy import Column, String, DateTime, Integer, Text, ForeignKey, Float, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Sandbox(Base):
    __tablename__ = "sandboxes"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default="pending", nullable=False)  # pending, running, stopped, expired, cancelled
    container_id = Column(String, nullable=True)
    container_name = Column(String, nullable=True)  # Nom du conteneur Docker
    access_url = Column(String, nullable=True)
    admin_username = Column(String, nullable=True)
    admin_password = Column(String, nullable=True)
    port = Column(Integer, nullable=True)  # Port d'accès
    software_version = Column(String, nullable=True)  # Version du logiciel
    price = Column(Float, nullable=False, default=0.0)
    currency = Column(String, default="eur", nullable=False)  # eur, usd, etc.
    payment_status = Column(String, default="pending", nullable=False)  # pending, paid, failed, refunded
    stripe_customer_id = Column(String, nullable=True)
    stripe_payment_intent_id = Column(String, nullable=True)
    stripe_subscription_id = Column(String, nullable=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    software_type_id = Column(String, ForeignKey("software_types.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    duration_hours = Column(Integer, nullable=False)
    
    # Métadonnées supplémentaires pour la flexibilité
    sandbox_metadata = Column(JSON, nullable=True)  # Stockage de métadonnées spécifiques au logiciel
    
    # Relationships
    user = relationship("User", back_populates="sandboxes")
    software_type = relationship("SoftwareType", back_populates="sandboxes") 