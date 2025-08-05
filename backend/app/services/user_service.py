from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.auth import UserResponse, UserUpdate
from app.services.role_service import RoleService
import uuid

class UserService:
    @staticmethod
    def get_all_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        """Récupère tous les utilisateurs (admin seulement)"""
        users = db.query(User).offset(skip).limit(limit).all()
        # Charger explicitement les rôles pour chaque utilisateur
        for user in users:
            db.refresh(user)
        return users
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
        """Récupère un utilisateur par son ID"""
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """Récupère un utilisateur par son email"""
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def create_user(db: Session, email: str, name: str, password: str, role_names: List[str] = None) -> User:
        """Crée un nouvel utilisateur"""
        user_id = str(uuid.uuid4())
        user = User(
            id=user_id,
            email=email,
            name=name
        )
        user.set_password(password)
        
        # Ajouter les rôles
        if role_names:
            for role_name in role_names:
                role = RoleService.get_role_by_name(db, role_name)
                if role:
                    user.roles.append(role)
        
        # Par défaut, ajouter le rôle customer si aucun rôle n'est spécifié
        if not role_names or not user.roles:
            customer_role = RoleService.get_or_create_customer_role(db)
            user.roles.append(customer_role)
        
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def update_user(db: Session, user_id: str, user_data: UserUpdate) -> Optional[User]:
        """Met à jour un utilisateur"""
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            if user_data.name is not None:
                user.name = user_data.name
            if user_data.email is not None:
                user.email = user_data.email
            if user_data.is_active is not None:
                user.is_active = user_data.is_active
            if user_data.is_verified is not None:
                user.is_verified = user_data.is_verified
            if user_data.avatar_url is not None:
                user.avatar_url = user_data.avatar_url
            db.commit()
            db.refresh(user)
        return user
    
    @staticmethod
    def add_role_to_user(db: Session, user_id: str, role_name: str) -> Optional[User]:
        """Ajoute un rôle à un utilisateur"""
        user = db.query(User).filter(User.id == user_id).first()
        role = RoleService.get_role_by_name(db, role_name)
        if user and role and role not in user.roles:
            user.roles.append(role)
            db.commit()
            db.refresh(user)
        return user
    
    @staticmethod
    def remove_role_from_user(db: Session, user_id: str, role_name: str) -> Optional[User]:
        """Retire un rôle d'un utilisateur"""
        user = db.query(User).filter(User.id == user_id).first()
        role = RoleService.get_role_by_name(db, role_name)
        if user and role and role in user.roles:
            # Empêcher la suppression du rôle admin pour l'utilisateur admin
            if user.email == "admin@admin.fr" and role_name == "admin":
                return None
            user.roles.remove(role)
            db.commit()
            db.refresh(user)
        return user
    
    @staticmethod
    def deactivate_user(db: Session, user_id: str) -> Optional[User]:
        """Désactive un utilisateur (admin seulement)"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("Utilisateur non trouvé")
        
        # Empêcher la désactivation des admins
        if user.has_role("admin"):
            raise ValueError("Impossible de désactiver un utilisateur avec le rôle admin")
        
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
        if not user:
            raise ValueError("Utilisateur non trouvé")
        
        # Empêcher la suppression des admins
        if user.has_role("admin"):
            raise ValueError("Impossible de supprimer un utilisateur avec le rôle admin")
        
        db.delete(user)
        db.commit()
        return True
    
    @staticmethod
    def create_admin_user(db: Session) -> User:
        """Crée l'utilisateur admin par défaut"""
        existing_admin = db.query(User).filter(User.email == "admin@admin.fr").first()
        if existing_admin:
            return existing_admin
        
        # Créer l'utilisateur avec le rôle admin
        admin_user = UserService.create_user(
            db=db,
            email="admin@admin.fr",
            name="Administrateur",
            password="admin",
            role_names=["admin"]
        )
        return admin_user
    
    @staticmethod
    def get_user_response(user: User) -> dict:
        """Convertit un utilisateur en dictionnaire pour la réponse"""
        return {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "avatar_url": user.avatar_url,
            "google_id": user.google_id,
            "roles": [role.name for role in user.roles],
            "created_at": user.created_at.isoformat() if user.created_at else None
        } 