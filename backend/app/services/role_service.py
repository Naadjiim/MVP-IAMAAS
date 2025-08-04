from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.role import Role
from app.schemas.role import RoleCreate, RoleUpdate
import uuid

class RoleService:
    @staticmethod
    def get_all_roles(db: Session, skip: int = 0, limit: int = 100) -> List[Role]:
        """Récupère tous les rôles"""
        return db.query(Role).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_role_by_id(db: Session, role_id: str) -> Optional[Role]:
        """Récupère un rôle par son ID"""
        return db.query(Role).filter(Role.id == role_id).first()
    
    @staticmethod
    def get_role_by_name(db: Session, name: str) -> Optional[Role]:
        """Récupère un rôle par son nom"""
        return db.query(Role).filter(Role.name == name).first()
    
    @staticmethod
    def create_role(db: Session, role_data: RoleCreate) -> Role:
        """Crée un nouveau rôle"""
        role_id = str(uuid.uuid4())
        role = Role(
            id=role_id,
            name=role_data.name,
            description=role_data.description
        )
        db.add(role)
        db.commit()
        db.refresh(role)
        return role
    
    @staticmethod
    def update_role(db: Session, role_id: str, role_data: RoleUpdate) -> Optional[Role]:
        """Met à jour un rôle"""
        role = db.query(Role).filter(Role.id == role_id).first()
        if role:
            if role_data.name is not None:
                role.name = role_data.name
            if role_data.description is not None:
                role.description = role_data.description
            db.commit()
            db.refresh(role)
        return role
    
    @staticmethod
    def delete_role(db: Session, role_id: str) -> bool:
        """Supprime un rôle"""
        role = db.query(Role).filter(Role.id == role_id).first()
        if role:
            # Empêcher la suppression du rôle admin
            if role.name == "admin":
                return False
            db.delete(role)
            db.commit()
            return True
        return False
    
    @staticmethod
    def get_or_create_admin_role(db: Session) -> Role:
        """Récupère ou crée le rôle admin"""
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        if not admin_role:
            admin_role = RoleService.create_role(
                db=db,
                role_data=RoleCreate(
                    name="admin",
                    description="Administrateur du système"
                )
            )
        return admin_role
    
    @staticmethod
    def get_or_create_customer_role(db: Session) -> Role:
        """Récupère ou crée le rôle customer"""
        customer_role = db.query(Role).filter(Role.name == "customer").first()
        if not customer_role:
            customer_role = RoleService.create_role(
                db=db,
                role_data=RoleCreate(
                    name="customer",
                    description="Client utilisateur"
                )
            )
        return customer_role 