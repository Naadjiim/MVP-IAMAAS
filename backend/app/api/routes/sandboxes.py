from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional
import logging
import uuid

from app.database import get_db
from app.models.user import User
from app.models.sandbox import Sandbox
from app.schemas.sandbox import SandboxCreate, SandboxResponse, SandboxUpdate, PaymentIntentResponse
from app.core.security import get_current_user, rate_limit, sanitize_error_message
from app.services.stripe_service import StripeService
from app.services.docker_service import DockerService
from app.services.email_service import EmailService
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/sandboxes/", response_model=PaymentIntentResponse, status_code=status.HTTP_200_OK)
async def create_sandbox_payment(
    sandbox_data: SandboxCreate, 
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Créer une intention de paiement pour une sandbox"""
    # Rate limiting pour la création de sandboxes
    rate_limit(request, limit_per_minute=3, limit_per_hour=20)
    
    # Validation des données
    if len(sandbox_data.name.strip()) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le nom de la sandbox doit contenir au moins 3 caractères"
        )
    
    if sandbox_data.duration_hours < 1 or sandbox_data.duration_hours > 168:  # Max 7 jours
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La durée doit être comprise entre 1 et 168 heures"
        )
    
    stripe_service = StripeService(db)
    
    try:
        # Calculer le prix avec PricingService
        from app.services.pricing_service import PricingService
        price = PricingService.calculate_price(db, sandbox_data.software_type_id, sandbox_data.duration_hours)
        
        # Mode de test : créer une intention de paiement simulée si Stripe n'est pas configuré
        import os
        stripe_key = os.getenv('STRIPE_SECRET_KEY', '')
        
        if not stripe_key or stripe_key == 'your-stripe-secret-key':
            # Mode test - créer une intention de paiement simulée
            payment_intent = {
                'id': f'test_pi_{str(uuid.uuid4())}',
                'client_secret': 'test_secret',
                'amount': int(price * 100),
                'currency': 'eur',
                'status': 'requires_payment_method'
            }
            logger.info("Mode test activé - intention de paiement simulée créée")
        else:
            # Mode production - utiliser Stripe
            payment_intent = stripe_service.create_payment_intent(
                amount=price,
                currency="eur",
                metadata={
                    'sandbox_name': sandbox_data.name,
                    'sandbox_description': sandbox_data.description or '',
                    'sandbox_duration_hours': str(sandbox_data.duration_hours),
                    'sandbox_software_type_id': sandbox_data.software_type_id,
                    'user_id': current_user.id,
                    'user_email': current_user.email
                }
            )
        
        # Créer l'enregistrement sandbox en attente
        from datetime import datetime, timedelta
        
        # Calculer la date d'expiration basée sur la durée
        expires_at = datetime.utcnow() + timedelta(hours=sandbox_data.duration_hours)
        
        sandbox = Sandbox(
            id=payment_intent['id'],  # Utiliser l'ID de l'intention de paiement
            name=sandbox_data.name,
            email=current_user.email,
            description=sandbox_data.description,
            status="pending",
            price=price,
            currency="eur",
            payment_status="pending",
            user_id=current_user.id,
            software_type_id=sandbox_data.software_type_id,
            duration_hours=sandbox_data.duration_hours,
            expires_at=expires_at
        )
        
        db.add(sandbox)
        db.commit()
        
        logger.info(f"Intention de paiement créée pour {current_user.email}: {sandbox_data.name}")
        
        return PaymentIntentResponse(
            payment_intent_id=payment_intent['id'],
            client_secret=payment_intent['client_secret'],
            amount=payment_intent['amount'],
            currency=payment_intent['currency'],
            sandbox_id=None  # La sandbox n'existe pas encore
        )
        
    except Exception as e:
        logger.error(f"Erreur lors de la création de l'intention de paiement: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=sanitize_error_message("Erreur lors de la création de l'intention de paiement")
        )

@router.post("/sandboxes/{sandbox_id}/confirm-payment", response_model=SandboxResponse, status_code=status.HTTP_200_OK)
async def confirm_sandbox_payment(
    sandbox_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Confirmer le paiement et créer la sandbox"""
    stripe_service = StripeService(db)
    docker_service = DockerService()
    email_service = EmailService()
    
    try:
        # Vérifier le statut du paiement Stripe
        payment_intent = stripe_service.get_payment_intent(sandbox_id)  # sandbox_id est en fait payment_intent_id
        
        if payment_intent['status'] != 'succeeded':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le paiement n'a pas été confirmé"
            )
        
        # Récupérer les métadonnées de l'intention de paiement
        metadata = payment_intent.get('metadata', {})
        
        # Vérifier que l'utilisateur correspond
        if metadata.get('user_id') != current_user.id:
            logger.warning(f"Tentative d'accès non autorisé à la sandbox {sandbox_id} par {current_user.email}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous n'êtes pas autorisé à confirmer ce paiement"
            )
        
        # Récupérer la sandbox en attente
        db_sandbox = db.query(Sandbox).filter(Sandbox.id == sandbox_id).first()
        if not db_sandbox:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sandbox non trouvée"
            )
        
        # Créer la sandbox maintenant que le paiement est confirmé
        container_info = await docker_service.create_keycloak_container(
            sandbox_id=db_sandbox.id,
            name=db_sandbox.name,
            duration_hours=db_sandbox.duration_hours
        )
        
        # Mettre à jour la sandbox avec les informations du conteneur
        db_sandbox.container_id = container_info['container_id']
        db_sandbox.container_name = container_info['container_name']
        db_sandbox.access_url = container_info['access_url']
        db_sandbox.admin_username = container_info['admin_username']
        
        # Récupérer le mot de passe correct depuis le conteneur
        if container_info['admin_password'] == 'admin':
            real_password = await docker_service.get_keycloak_admin_password(container_info['container_name'])
            if real_password:
                db_sandbox.admin_password = real_password
            else:
                db_sandbox.admin_password = container_info['admin_password']
        else:
            db_sandbox.admin_password = container_info['admin_password']
        
        db_sandbox.status = "running"  # Maintenant en cours d'exécution
        db.commit()
        
        # Envoyer l'email de notification
        await email_service.send_sandbox_created_email(
            current_user.email,
            db_sandbox.name,
            container_info['access_url'],
            container_info['admin_username'],
            db_sandbox.admin_password,
            db_sandbox.expires_at
        )
        
        logger.info(f"Sandbox créée avec succès pour {current_user.email}: {db_sandbox.name}")
        
        return db_sandbox
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la confirmation du paiement: {str(e)}")
        # En cas d'erreur, marquer comme arrêtée
        if 'db_sandbox' in locals():
            db_sandbox.status = "stopped"
            db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=sanitize_error_message("Erreur lors du déploiement du conteneur")
        )

@router.get("/sandboxes/", response_model=List[SandboxResponse])
async def get_sandboxes(
    current_user: User = Depends(get_current_user),
    status_filter: Optional[str] = Query(None, description="Filtrer par statut"),
    software_type_filter: Optional[str] = Query(None, description="Filtrer par type de logiciel"),
    db: Session = Depends(get_db)
):
    """Récupérer la liste des sandboxes de l'utilisateur connecté"""
    logger.info(f"Récupération des sandboxes pour l'utilisateur: {current_user.email} (ID: {current_user.id})")
    
    # Debug: vérifier si l'utilisateur est bien authentifié
    if not current_user:
        logger.error("Utilisateur non authentifié")
        raise HTTPException(status_code=401, detail="Utilisateur non authentifié")
    
    query = db.query(Sandbox).filter(Sandbox.user_id == current_user.id)
    
    # Appliquer les filtres
    if status_filter:
        query = query.filter(Sandbox.status == status_filter)
    
    if software_type_filter:
        query = query.filter(Sandbox.software_type_id == software_type_filter)
    
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

@router.get("/sandboxes/{sandbox_id}/fix-password", response_model=SandboxResponse)
async def fix_sandbox_password(
    sandbox_id: str, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer le mot de passe correct d'une sandbox"""
    sandbox = db.query(Sandbox).filter(
        Sandbox.id == sandbox_id,
        Sandbox.user_id == current_user.id
    ).first()
    
    if not sandbox:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sandbox non trouvée"
        )
    
    if sandbox.status != "running":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La sandbox doit être en cours d'exécution"
        )
    
    if not sandbox.container_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nom de conteneur manquant"
        )
    
    try:
        # Récupérer le mot de passe correct depuis le conteneur
        docker_service = DockerService()
        real_password = await docker_service.get_keycloak_admin_password(sandbox.container_name)
        
        if real_password:
            # Mettre à jour la base de données
            sandbox.admin_password = real_password
            db.commit()
            logger.info(f"Mot de passe corrigé pour la sandbox {sandbox.name} de {current_user.email}")
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Impossible de récupérer le mot de passe depuis le conteneur"
            )
        
        return sandbox
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la récupération du mot de passe: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=sanitize_error_message("Erreur lors de la récupération du mot de passe")
        )

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
        # Supprimer le conteneur Docker
        if sandbox.container_name:
            try:
                docker_service = DockerService()
                await docker_service.delete_keycloak_container(sandbox.container_name)
            except Exception as e:
                logger.warning(f"Erreur lors de la suppression du conteneur {sandbox.container_name}: {str(e)}")
        
        # Supprimer la sandbox de la base de données
        db.delete(sandbox)
        db.commit()
        
        logger.info(f"Sandbox supprimée par {current_user.email}: {sandbox.name}")
        
    except Exception as e:
        logger.error(f"Erreur lors de la suppression de la sandbox: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=sanitize_error_message("Erreur lors de la suppression de la sandbox")
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
    
    try:
        # Mettre à jour les champs autorisés
        if sandbox_data.name is not None:
            if len(sandbox_data.name.strip()) < 3:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Le nom de la sandbox doit contenir au moins 3 caractères"
                )
            sandbox.name = sandbox_data.name.strip()
        
        if sandbox_data.description is not None:
            sandbox.description = sandbox_data.description.strip()
        
        db.commit()
        db.refresh(sandbox)
        
        logger.info(f"Sandbox mise à jour par {current_user.email}: {sandbox.name}")
        
        return sandbox
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la mise à jour de la sandbox: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=sanitize_error_message("Erreur lors de la mise à jour de la sandbox")
        )

@router.get("/pricing")
async def get_pricing(db: Session = Depends(get_db)):
    """Récupérer les tarifs"""
    from app.services.pricing_service import PricingService
    return PricingService.get_pricing_info(db)

@router.get("/software-types")
async def get_software_types(db: Session = Depends(get_db)):
    """Récupérer les types de logiciels"""
    from app.services.software_type_service import SoftwareTypeService
    return SoftwareTypeService.get_active_software_types(db) 