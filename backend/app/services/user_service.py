from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.schemas.auth import UserResponse
import uuid

class UserService:
    @staticmethod
    def get_all_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        """Récupère tous les utilisateurs (admin seulement)"""
        return db.query(User).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
        """Récupère un utilisateur par son ID"""
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """Récupère un utilisateur par son email"""
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def create_user(db: Session, email: str, name: str, password: str, role: UserRole = UserRole.CUSTOMER) -> User:
        """Crée un nouvel utilisateur"""
        user_id = str(uuid.uuid4())
        user = User(
            id=user_id,
            email=email,
            name=name,
            role=role
        )
        user.set_password(password)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def update_user_role(db: Session, user_id: str, role: UserRole) -> Optional[User]:
        """Met à jour le rôle d'un utilisateur (admin seulement)"""
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.role = role
            db.commit()
            db.refresh(user)
        return user
    
    @staticmethod
    def deactivate_user(db: Session, user_id: str) -> Optional[User]:
        """Désactive un utilisateur (admin seulement)"""
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.is_active = False
            db.commit()
            db.refresh(user)
        return user
    
    @staticmethod
    def activate_user(db: Session, user_id: str) -> Optional[User]:
        """Active un utilisateur (admin seulement)"""
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.is_active = True
            db.commit()
            db.refresh(user)
        return user
    
    @staticmethod
    def delete_user(db: Session, user_id: str) -> bool:
        """Supprime un utilisateur (admin seulement)"""
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            db.delete(user)
            db.commit()
            return True
        return False
    
    @staticmethod
    def create_admin_user(db: Session) -> User:
        """Crée l'utilisateur admin par défaut"""
        existing_admin = db.query(User).filter(User.email == "admin@admin.fr").first()
        if existing_admin:
            return existing_admin
        
        return UserService.create_user(
            db=db,
            email="admin@admin.fr",
            name="Administrateur",
            password="admin",
            role=UserRole.ADMIN
        ) 