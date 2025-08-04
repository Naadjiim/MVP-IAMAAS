from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.services.user_service import UserService

from app.core.security import get_current_admin_user
from app.schemas.auth import UserResponse
from app.models.user import UserRole

router = APIRouter()

@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Récupère tous les utilisateurs (admin seulement)"""
    users = UserService.get_all_users(db, skip=skip, limit=limit)
    return users

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Récupère un utilisateur spécifique (admin seulement)"""
    user = UserService.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return user

@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    role: UserRole,
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Met à jour le rôle d'un utilisateur (admin seulement)"""
    user = UserService.update_user_role(db, user_id, role)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return {"message": f"Rôle de l'utilisateur {user.email} mis à jour vers {role.value}"}

@router.put("/users/{user_id}/deactivate")
async def deactivate_user(
    user_id: str,
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Désactive un utilisateur (admin seulement)"""
    user = UserService.deactivate_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return {"message": f"Utilisateur {user.email} désactivé"}

@router.put("/users/{user_id}/activate")
async def activate_user(
    user_id: str,
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Active un utilisateur (admin seulement)"""
    user = UserService.activate_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return {"message": f"Utilisateur {user.email} activé"}

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Supprime un utilisateur (admin seulement)"""
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas supprimer votre propre compte")
    
    success = UserService.delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return {"message": "Utilisateur supprimé avec succès"} 