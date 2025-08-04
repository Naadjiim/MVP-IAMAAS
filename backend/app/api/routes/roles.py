from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.services.role_service import RoleService
from app.core.security import get_current_admin_user
from app.schemas.role import RoleCreate, RoleUpdate, RoleResponse

router = APIRouter()

@router.get("/roles", response_model=List[RoleResponse])
async def get_all_roles(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Récupère tous les rôles (admin seulement)"""
    roles = RoleService.get_all_roles(db, skip=skip, limit=limit)
    return roles

@router.get("/roles/{role_id}", response_model=RoleResponse)
async def get_role(
    role_id: str,
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Récupère un rôle spécifique (admin seulement)"""
    role = RoleService.get_role_by_id(db, role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Rôle non trouvé")
    return role

@router.post("/roles", response_model=RoleResponse)
async def create_role(
    role_data: RoleCreate,
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Crée un nouveau rôle (admin seulement)"""
    # Vérifier si le rôle existe déjà
    existing_role = RoleService.get_role_by_name(db, role_data.name)
    if existing_role:
        raise HTTPException(status_code=400, detail="Un rôle avec ce nom existe déjà")
    
    role = RoleService.create_role(db, role_data)
    return role

@router.put("/roles/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: str,
    role_data: RoleUpdate,
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Met à jour un rôle (admin seulement)"""
    role = RoleService.update_role(db, role_id, role_data)
    if not role:
        raise HTTPException(status_code=404, detail="Rôle non trouvé")
    return role

@router.delete("/roles/{role_id}")
async def delete_role(
    role_id: str,
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Supprime un rôle (admin seulement)"""
    success = RoleService.delete_role(db, role_id)
    if not success:
        raise HTTPException(status_code=400, detail="Impossible de supprimer ce rôle (utilisé ou rôle admin)")
    return {"message": "Rôle supprimé avec succès"} 