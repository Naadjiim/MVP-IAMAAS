from sqlalchemy import Column, String, DateTime, Boolean, Table, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
from typing import List
import bcrypt

# Table de liaison many-to-many entre User et Role
user_roles = Table(
    'user_roles',
    Base.metadata,
    Column('user_id', String, ForeignKey('users.id'), primary_key=True),
    Column('role_id', String, ForeignKey('roles.id'), primary_key=True)
)

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=True)  # Null for Google OAuth users
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    avatar_url = Column(String, nullable=True)
    google_id = Column(String, nullable=True, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    roles = relationship("Role", secondary=user_roles, back_populates="users")
    sandboxes = relationship("Sandbox", back_populates="user", cascade="all, delete-orphan", lazy="dynamic")

    def set_password(self, password: str):
        """Hash and set password"""
        salt = bcrypt.gensalt()
        self.hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    def verify_password(self, password: str) -> bool:
        """Verify password against hash"""
        if not self.hashed_password:
            return False
        return bcrypt.checkpw(password.encode('utf-8'), self.hashed_password.encode('utf-8'))
    
    def has_role(self, role_name: str) -> bool:
        """Vérifie si l'utilisateur a un rôle spécifique"""
        return any(role.name == role_name for role in self.roles)
    
    def is_admin(self) -> bool:
        """Vérifie si l'utilisateur est admin"""
        return self.has_role("admin")
    
    @property
    def roles_list(self) -> List[str]:
        """Retourne la liste des noms de rôles"""
        return [role.name for role in self.roles] 