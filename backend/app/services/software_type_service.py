from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.software_type import SoftwareType
from app.schemas.software_type import SoftwareTypeCreate, SoftwareTypeUpdate
import uuid

class SoftwareTypeService:
    @staticmethod
    def get_all_software_types(db: Session, skip: int = 0, limit: int = 100) -> List[SoftwareType]:
        """Récupère tous les types de logiciels"""
        return db.query(SoftwareType).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_active_software_types(db: Session) -> List[SoftwareType]:
        """Récupère tous les types de logiciels actifs"""
        return db.query(SoftwareType).filter(SoftwareType.is_active == "true").all()
    
    @staticmethod
    def get_software_type_by_id(db: Session, software_type_id: str) -> Optional[SoftwareType]:
        """Récupère un type de logiciel par son ID"""
        return db.query(SoftwareType).filter(SoftwareType.id == software_type_id).first()
    
    @staticmethod
    def get_software_type_by_name(db: Session, name: str) -> Optional[SoftwareType]:
        """Récupère un type de logiciel par son nom"""
        return db.query(SoftwareType).filter(SoftwareType.name == name).first()
    
    @staticmethod
    def create_software_type(db: Session, software_type_data: SoftwareTypeCreate) -> SoftwareType:
        """Crée un nouveau type de logiciel"""
        software_type_id = str(uuid.uuid4())
        software_type = SoftwareType(
            id=software_type_id,
            name=software_type_data.name,
            description=software_type_data.description,
            base_price_per_hour=software_type_data.base_price_per_hour,
            is_active=software_type_data.is_active
        )
        db.add(software_type)
        db.commit()
        db.refresh(software_type)
        return software_type
    
    @staticmethod
    def update_software_type(db: Session, software_type_id: str, software_type_data: SoftwareTypeUpdate) -> Optional[SoftwareType]:
        """Met à jour un type de logiciel"""
        software_type = db.query(SoftwareType).filter(SoftwareType.id == software_type_id).first()
        if software_type:
            if software_type_data.name is not None:
                software_type.name = software_type_data.name
            if software_type_data.description is not None:
                software_type.description = software_type_data.description
            if software_type_data.base_price_per_hour is not None:
                software_type.base_price_per_hour = software_type_data.base_price_per_hour
            if software_type_data.is_active is not None:
                software_type.is_active = software_type_data.is_active
            db.commit()
            db.refresh(software_type)
        return software_type
    
    @staticmethod
    def delete_software_type(db: Session, software_type_id: str) -> bool:
        """Supprime un type de logiciel"""
        software_type = db.query(SoftwareType).filter(SoftwareType.id == software_type_id).first()
        if software_type:
            # Vérifier s'il y a des sandboxes qui utilisent ce type
            if software_type.sandboxes:
                return False  # Ne pas supprimer s'il y a des sandboxes associées
            db.delete(software_type)
            db.commit()
            return True
        return False
    
    @staticmethod
    def get_or_create_keycloak_software_type(db: Session) -> SoftwareType:
        """Récupère ou crée le type de logiciel Keycloak"""
        keycloak_type = db.query(SoftwareType).filter(SoftwareType.name == "keycloak").first()
        if not keycloak_type:
            keycloak_type = SoftwareTypeService.create_software_type(
                db=db,
                software_type_data=SoftwareTypeCreate(
                    name="keycloak",
                    description="Serveur d'authentification et d'autorisation Keycloak",
                    base_price_per_hour=5.0,
                    is_active="true"
                )
            )
        return keycloak_type 