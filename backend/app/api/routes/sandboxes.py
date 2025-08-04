from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from datetime import datetime, timedelta

from app.database import get_db
from app.models.sandbox import Sandbox
from app.models.user import User
from app.schemas.sandbox import SandboxCreate, SandboxResponse, SandboxUpdate
from app.services.docker_service import DockerService
from app.services.email_service import EmailService
from app.services.pricing_service import PricingService
from app.api.routes.auth import get_current_user

router = APIRouter()
docker_service = DockerService()
email_service = EmailService()

@router.post("/sandboxes/", response_model=SandboxResponse, status_code=status.HTTP_201_CREATED)
async def create_sandbox(
    sandbox_data: SandboxCreate, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Créer une nouvelle sandbox Keycloak"""
    try:
        # Générer un ID unique
        sandbox_id = str(uuid.uuid4())
        
        # Calculer la date d'expiration
        expires_at = datetime.utcnow() + timedelta(hours=sandbox_data.duration_hours)
        
        # Calculer le prix
        price = PricingService.calculate_price(db, sandbox_data.software_type_id, sandbox_data.duration_hours)
        
        # Créer l'enregistrement en base
        db_sandbox = Sandbox(
            id=sandbox_id,
            name=sandbox_data.name,
            email=current_user.email,  # Utiliser l'email de l'utilisateur connecté
            description=sandbox_data.description,
            duration_hours=sandbox_data.duration_hours,
            software_type_id=sandbox_data.software_type_id,
            price=price,
            user_id=current_user.id,
            expires_at=expires_at,
            status="running"
        )
        
        db.add(db_sandbox)
        db.commit()
        db.refresh(db_sandbox)
        
        # Déployer le conteneur Keycloak
        try:
            container_info = await docker_service.create_keycloak_container(sandbox_id)
            db_sandbox.container_id = container_info['container_id']
            db_sandbox.access_url = container_info['access_url']
            db_sandbox.admin_username = container_info['admin_username']
            db_sandbox.admin_password = container_info['admin_password']
            db.commit()
            
            # Envoyer l'email de notification
            await email_service.send_sandbox_created_email(
                current_user.email,  # Utiliser l'email de l'utilisateur connecté
                sandbox_data.name,
                container_info['access_url'],
                container_info['admin_username'],
                container_info['admin_password'],
                expires_at
            )
            
        except Exception as e:
            # En cas d'erreur, marquer comme arrêtée
            db_sandbox.status = "stopped"
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erreur lors du déploiement du conteneur: {str(e)}"
            )
        
        return db_sandbox
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la création de la sandbox: {str(e)}"
        )

@router.get("/sandboxes/", response_model=List[SandboxResponse])
async def get_sandboxes(
    current_user: User = Depends(get_current_user),
    status_filter: Optional[str] = Query(None, description="Filtrer par statut"),
    software_type_filter: Optional[str] = Query(None, description="Filtrer par type de logiciel"),
    db: Session = Depends(get_db)
):
    """Récupérer la liste des sandboxes de l'utilisateur connecté"""
    query = db.query(Sandbox).filter(Sandbox.user_id == current_user.id)
    
    # Appliquer les filtres
    if status_filter:
        query = query.filter(Sandbox.status == status_filter)
    
    if software_type_filter:
        query = query.filter(Sandbox.software_type == software_type_filter)
    
    sandboxes = query.order_by(Sandbox.created_at.desc()).all()
    return sandboxes

@router.get("/sandboxes/{sandbox_id}", response_model=SandboxResponse)
async def get_sandbox(
    sandbox_id: str, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer une sandbox spécifique"""
    sandbox = db.query(Sandbox).filter(
        Sandbox.id == sandbox_id,
        Sandbox.user_id == current_user.id
    ).first()
    if not sandbox:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sandbox non trouvée"
        )
    return sandbox

@router.delete("/sandboxes/{sandbox_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sandbox(
    sandbox_id: str, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprimer une sandbox"""
    sandbox = db.query(Sandbox).filter(
        Sandbox.id == sandbox_id,
        Sandbox.user_id == current_user.id
    ).first()
    if not sandbox:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sandbox non trouvée"
        )
    
    try:
        # Arrêter et supprimer le conteneur
        if sandbox.container_id:
            await docker_service.delete_container(sandbox.container_id)
        
        # Supprimer de la base
        db.delete(sandbox)
        db.commit()
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la suppression: {str(e)}"
        )

@router.put("/sandboxes/{sandbox_id}", response_model=SandboxResponse)
async def update_sandbox(
    sandbox_id: str, 
    sandbox_data: SandboxUpdate, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mettre à jour une sandbox"""
    sandbox = db.query(Sandbox).filter(
        Sandbox.id == sandbox_id,
        Sandbox.user_id == current_user.id
    ).first()
    if not sandbox:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sandbox non trouvée"
        )
    
    # Mettre à jour les champs fournis
    update_data = sandbox_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(sandbox, field, value)
    
    # Si la durée a changé, recalculer l'expiration
    if 'duration_hours' in update_data:
        sandbox.duration_hours = update_data['duration_hours']
        sandbox.expires_at = datetime.utcnow() + timedelta(hours=update_data['duration_hours'])
    
    db.commit()
    db.refresh(sandbox)
    return sandbox

@router.get("/pricing")
async def get_pricing(db: Session = Depends(get_db)):
    """Obtenir les informations de pricing"""
    return PricingService.get_pricing_info(db)

@router.get("/software-types")
async def get_software_types(db: Session = Depends(get_db)):
    """Obtenir les types de logiciels disponibles (public)"""
    from app.services.software_type_service import SoftwareTypeService
    software_types = SoftwareTypeService.get_all_software_types(db)
    return [
        {
            "id": st.id,
            "name": st.name,
            "description": st.description,
            "base_price_per_hour": st.base_price_per_hour,
            "is_active": st.is_active
        }
        for st in software_types
    ] 