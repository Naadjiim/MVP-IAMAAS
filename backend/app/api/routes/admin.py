from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.services.user_service import UserService

from app.core.security import get_current_admin_user
from app.schemas.auth import UserResponse
from app.services.role_service import RoleService


router = APIRouter()

@router.get("/users")
async def get_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Récupère tous les utilisateurs (admin seulement)"""
    users = UserService.get_all_users(db, skip=skip, limit=limit)
    return [UserService.get_user_response(user) for user in users]

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

@router.get("/roles")
async def get_all_roles(
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Récupère tous les rôles disponibles (admin seulement)"""
    roles = RoleService.get_all_roles(db)
    return [{"id": role.id, "name": role.name, "description": role.description} for role in roles]

@router.post("/users/{user_id}/roles")
async def add_role_to_user(
    user_id: str,
    role_data: dict = Body(...),
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Ajoute un rôle à un utilisateur (admin seulement)"""
    role_name = role_data.get("role_name")
    if not role_name:
        raise HTTPException(status_code=400, detail="role_name est requis")
    
    user = UserService.add_role_to_user(db, user_id, role_name)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return {"message": f"Rôle '{role_name}' ajouté à l'utilisateur {user.email}"}

@router.delete("/users/{user_id}/roles/{role_name}")
async def remove_role_from_user(
    user_id: str,
    role_name: str,
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Retire un rôle d'un utilisateur (admin seulement)"""
    user = UserService.remove_role_from_user(db, user_id, role_name)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé ou opération non autorisée")
    return {"message": f"Rôle '{role_name}' retiré de l'utilisateur {user.email}"}

@router.put("/users/{user_id}/deactivate")
async def deactivate_user(
    user_id: str,
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Désactive un utilisateur (admin seulement)"""
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas désactiver votre propre compte")
    
    try:
        user = UserService.deactivate_user(db, user_id)
        return {"message": f"Utilisateur {user.email} désactivé"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

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

@router.get("/users/{user_id}/sandboxes")
async def get_user_sandboxes(
    user_id: str,
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Récupère les sandboxes d'un utilisateur spécifique (admin seulement)"""
    from app.services.sandbox_service import SandboxService
    sandboxes = SandboxService.get_sandboxes_by_user_id(db, user_id)
    return sandboxes

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Supprime un utilisateur et ses sandboxes (admin seulement)"""
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas supprimer votre propre compte")
    
    try:
        # Récupérer les sandboxes de l'utilisateur avant suppression
        from app.services.sandbox_service import SandboxService
        user_sandboxes = SandboxService.get_sandboxes_by_user_id(db, user_id)
        
        # Supprimer l'utilisateur et ses sandboxes
        success = await UserService.delete_user_with_sandboxes(db, user_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
        
        return {
            "message": "Utilisateur supprimé avec succès",
            "deleted_sandboxes_count": len(user_sandboxes),
            "deleted_sandboxes": [
                {
                    "id": sandbox.id,
                    "name": sandbox.name,
                    "status": sandbox.status,
                    "container_name": sandbox.container_name
                } for sandbox in user_sandboxes
            ]
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/sandboxes/")
async def get_all_sandboxes(
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Récupère toutes les sandboxes (admin seulement)"""
    from app.services.sandbox_service import SandboxService
    sandboxes = SandboxService.get_all_sandboxes(db)
    return sandboxes

@router.delete("/sandboxes/{sandbox_id}")
async def delete_sandbox(
    sandbox_id: str,
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Supprime une sandbox (admin seulement)"""
    from app.services.sandbox_service import SandboxService
    success = await SandboxService.delete_sandbox(db, sandbox_id)
    if not success:
        raise HTTPException(status_code=404, detail="Sandbox non trouvée")
    return {"message": "Sandbox supprimée avec succès"} 