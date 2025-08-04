from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.pricing import Pricing
from app.schemas.pricing import PricingCreate, PricingUpdate
import uuid

class PricingService:
    @staticmethod
    def get_all_pricing(db: Session, skip: int = 0, limit: int = 100) -> List[Pricing]:
        """Récupère tous les tarifs"""
        return db.query(Pricing).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_active_pricing(db: Session) -> List[Pricing]:
        """Récupère tous les tarifs actifs"""
        return db.query(Pricing).filter(Pricing.is_active == "true").all()
    
    @staticmethod
    def get_pricing_by_id(db: Session, pricing_id: str) -> Optional[Pricing]:
        """Récupère un tarif par son ID"""
        return db.query(Pricing).filter(Pricing.id == pricing_id).first()
    
    @staticmethod
    def get_pricing_by_software_type_and_duration(db: Session, software_type_id: str, duration_hours: int) -> Optional[Pricing]:
        """Récupère un tarif par type de logiciel et durée"""
        return db.query(Pricing).filter(
            Pricing.software_type_id == software_type_id,
            Pricing.duration_hours == duration_hours,
            Pricing.is_active == "true"
        ).first()
    
    @staticmethod
    def get_pricing_by_software_type(db: Session, software_type_id: str) -> List[Pricing]:
        """Récupère tous les tarifs pour un type de logiciel"""
        return db.query(Pricing).filter(
            Pricing.software_type_id == software_type_id,
            Pricing.is_active == "true"
        ).all()
    
    @staticmethod
    def create_pricing(db: Session, pricing_data: PricingCreate) -> Pricing:
        """Crée un nouveau tarif"""
        pricing_id = str(uuid.uuid4())
        pricing = Pricing(
            id=pricing_id,
            software_type_id=pricing_data.software_type_id,
            duration_hours=pricing_data.duration_hours,
            price=pricing_data.price,
            is_active=pricing_data.is_active
        )
        db.add(pricing)
        db.commit()
        db.refresh(pricing)
        return pricing
    
    @staticmethod
    def update_pricing(db: Session, pricing_id: str, pricing_data: PricingUpdate) -> Optional[Pricing]:
        """Met à jour un tarif"""
        pricing = db.query(Pricing).filter(Pricing.id == pricing_id).first()
        if pricing:
            if pricing_data.software_type_id is not None:
                pricing.software_type_id = pricing_data.software_type_id
            if pricing_data.duration_hours is not None:
                pricing.duration_hours = pricing_data.duration_hours
            if pricing_data.price is not None:
                pricing.price = pricing_data.price
            if pricing_data.is_active is not None:
                pricing.is_active = pricing_data.is_active
            db.commit()
            db.refresh(pricing)
        return pricing
    
    @staticmethod
    def delete_pricing(db: Session, pricing_id: str) -> bool:
        """Supprime un tarif"""
        pricing = db.query(Pricing).filter(Pricing.id == pricing_id).first()
        if pricing:
            db.delete(pricing)
            db.commit()
            return True
        return False
    
    @staticmethod
    def calculate_price(db: Session, software_type_id: str, duration_hours: int) -> float:
        """Calcule le prix pour un type de logiciel et une durée donnée"""
        pricing = PricingService.get_pricing_by_software_type_and_duration(db, software_type_id, duration_hours)
        if pricing:
            return pricing.price
        
        # Si pas de tarif spécifique, calculer avec le prix de base
        from app.services.software_type_service import SoftwareTypeService
        software_type = SoftwareTypeService.get_software_type_by_id(db, software_type_id)
        if software_type:
            return software_type.base_price_per_hour * duration_hours
        
        return 0.0
    
    @staticmethod
    def create_default_pricing_for_keycloak(db: Session) -> List[Pricing]:
        """Crée les tarifs par défaut pour Keycloak"""
        from app.services.software_type_service import SoftwareTypeService
        keycloak_type = SoftwareTypeService.get_or_create_keycloak_software_type(db)
        
        default_pricing = [
            {"duration_hours": 1, "price": 5.0},
            {"duration_hours": 2, "price": 9.0},
            {"duration_hours": 4, "price": 17.0},
            {"duration_hours": 8, "price": 32.0},
            {"duration_hours": 24, "price": 90.0},
        ]
        
        created_pricing = []
        for pricing_data in default_pricing:
            existing = PricingService.get_pricing_by_software_type_and_duration(
                db, keycloak_type.id, pricing_data["duration_hours"]
            )
            if not existing:
                pricing = PricingService.create_pricing(
                    db=db,
                    pricing_data=PricingCreate(
                        software_type_id=keycloak_type.id,
                        duration_hours=pricing_data["duration_hours"],
                        price=pricing_data["price"],
                        is_active="true"
                    )
                )
                created_pricing.append(pricing)
        
        return created_pricing
    
    @staticmethod
    def get_pricing_info(db: Session) -> dict:
        """Récupère les informations de pricing pour l'affichage"""
        from app.services.software_type_service import SoftwareTypeService
        
        # Récupérer tous les types de logiciels
        software_types = SoftwareTypeService.get_all_software_types(db)
        
        pricing_info = {}
        for software_type in software_types:
            # Récupérer les tarifs pour ce type de logiciel
            pricing_list = PricingService.get_pricing_by_software_type(db, software_type.id)
            
            pricing_info[software_type.name] = {
                "software_type_id": software_type.id,
                "base_price_per_hour": software_type.base_price_per_hour,
                "pricing_options": [
                    {
                        "duration_hours": pricing.duration_hours,
                        "price": pricing.price,
                        "is_active": pricing.is_active
                    }
                    for pricing in pricing_list
                ]
            }
        
        return pricing_info 