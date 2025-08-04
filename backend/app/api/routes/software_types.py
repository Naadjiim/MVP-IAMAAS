from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.services.software_type_service import SoftwareTypeService
from app.core.security import get_current_admin_user
from app.schemas.software_type import SoftwareTypeCreate, SoftwareTypeUpdate, SoftwareTypeResponse

router = APIRouter()

@router.get("/software-types", response_model=List[SoftwareTypeResponse])
async def get_all_software_types(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Récupère tous les types de logiciels (admin seulement)"""
    software_types = SoftwareTypeService.get_all_software_types(db, skip=skip, limit=limit)
    return software_types

@router.get("/software-types/active", response_model=List[SoftwareTypeResponse])
async def get_active_software_types(
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Récupère tous les types de logiciels actifs (admin seulement)"""
    software_types = SoftwareTypeService.get_active_software_types(db)
    return software_types

@router.get("/software-types/{type_id}", response_model=SoftwareTypeResponse)
async def get_software_type(
    type_id: str,
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Récupère un type de logiciel spécifique (admin seulement)"""
    software_type = SoftwareTypeService.get_software_type_by_id(db, type_id)
    if not software_type:
        raise HTTPException(status_code=404, detail="Type de logiciel non trouvé")
    return software_type

@router.post("/software-types", response_model=SoftwareTypeResponse)
async def create_software_type(
    software_type_data: SoftwareTypeCreate,
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Crée un nouveau type de logiciel (admin seulement)"""
    # Vérifier si le type existe déjà
    existing_type = SoftwareTypeService.get_software_type_by_name(db, software_type_data.name)
    if existing_type:
        raise HTTPException(status_code=400, detail="Un type de logiciel avec ce nom existe déjà")
    
    software_type = SoftwareTypeService.create_software_type(db, software_type_data)
    return software_type

@router.put("/software-types/{type_id}", response_model=SoftwareTypeResponse)
async def update_software_type(
    type_id: str,
    software_type_data: SoftwareTypeUpdate,
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Met à jour un type de logiciel (admin seulement)"""
    software_type = SoftwareTypeService.update_software_type(db, type_id, software_type_data)
    if not software_type:
        raise HTTPException(status_code=404, detail="Type de logiciel non trouvé")
    return software_type

@router.delete("/software-types/{type_id}")
async def delete_software_type(
    type_id: str,
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Supprime un type de logiciel (admin seulement)"""
    success = SoftwareTypeService.delete_software_type(db, type_id)
    if not success:
        raise HTTPException(status_code=400, detail="Impossible de supprimer ce type (utilisé par des sandboxes)")
    return {"message": "Type de logiciel supprimé avec succès"} 