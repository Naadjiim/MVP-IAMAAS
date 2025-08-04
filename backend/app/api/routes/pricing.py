from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.services.pricing_service import PricingService
from app.core.security import get_current_admin_user
from app.schemas.pricing import PricingCreate, PricingUpdate, PricingResponse

router = APIRouter()

@router.get("/pricing", response_model=List[PricingResponse])
async def get_all_pricing(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Récupère tous les tarifs (admin seulement)"""
    pricing_list = PricingService.get_all_pricing(db, skip=skip, limit=limit)
    return pricing_list

@router.get("/pricing/active", response_model=List[PricingResponse])
async def get_active_pricing(
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Récupère tous les tarifs actifs (admin seulement)"""
    pricing_list = PricingService.get_active_pricing(db)
    return pricing_list

@router.get("/pricing/{pricing_id}", response_model=PricingResponse)
async def get_pricing(
    pricing_id: str,
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Récupère un tarif spécifique (admin seulement)"""
    pricing = PricingService.get_pricing_by_id(db, pricing_id)
    if not pricing:
        raise HTTPException(status_code=404, detail="Tarif non trouvé")
    return pricing

@router.get("/pricing/software-type/{software_type_id}", response_model=List[PricingResponse])
async def get_pricing_by_software_type(
    software_type_id: str,
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Récupère tous les tarifs pour un type de logiciel (admin seulement)"""
    pricing_list = PricingService.get_pricing_by_software_type(db, software_type_id)
    return pricing_list

@router.post("/pricing", response_model=PricingResponse)
async def create_pricing(
    pricing_data: PricingCreate,
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Crée un nouveau tarif (admin seulement)"""
    # Vérifier si le tarif existe déjà pour ce type et cette durée
    existing_pricing = PricingService.get_pricing_by_software_type_and_duration(
        db, pricing_data.software_type_id, pricing_data.duration_hours
    )
    if existing_pricing:
        raise HTTPException(status_code=400, detail="Un tarif existe déjà pour ce type et cette durée")
    
    pricing = PricingService.create_pricing(db, pricing_data)
    return pricing

@router.put("/pricing/{pricing_id}", response_model=PricingResponse)
async def update_pricing(
    pricing_id: str,
    pricing_data: PricingUpdate,
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Met à jour un tarif (admin seulement)"""
    pricing = PricingService.update_pricing(db, pricing_id, pricing_data)
    if not pricing:
        raise HTTPException(status_code=404, detail="Tarif non trouvé")
    return pricing

@router.delete("/pricing/{pricing_id}")
async def delete_pricing(
    pricing_id: str,
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Supprime un tarif (admin seulement)"""
    success = PricingService.delete_pricing(db, pricing_id)
    if not success:
        raise HTTPException(status_code=404, detail="Tarif non trouvé")
    return {"message": "Tarif supprimé avec succès"}

@router.post("/pricing/calculate")
async def calculate_price(
    software_type_id: str,
    duration_hours: int,
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Calcule le prix pour un type de logiciel et une durée (admin seulement)"""
    price = PricingService.calculate_price(db, software_type_id, duration_hours)
    return {
        "software_type_id": software_type_id,
        "duration_hours": duration_hours,
        "calculated_price": price
    } 