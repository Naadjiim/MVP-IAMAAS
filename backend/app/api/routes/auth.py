from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.auth_service import AuthService
from app.schemas.auth import UserCreate, UserLogin, GoogleLogin, AuthResponse, UserResponse, UserUpdate, PasswordChange
from app.core.security import get_current_user, validate_password, rate_limit, sanitize_error_message
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/register", response_model=AuthResponse)
async def register(
    user_data: UserCreate, 
    request: Request,
    db: Session = Depends(get_db)
):
    """Register a new user"""
    # Rate limiting pour l'inscription
    rate_limit(request, limit_per_minute=5, limit_per_hour=20)
    
    # Validation du mot de passe
    if not validate_password(user_data.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Le mot de passe doit contenir au moins {settings.MIN_PASSWORD_LENGTH} caractères, "
                   f"une majuscule, une minuscule, un chiffre et un caractère spécial"
        )
    
    auth_service = AuthService(db)
    
    try:
        user = auth_service.create_user(user_data)
        token = auth_service.create_access_token(user)
        user_response = auth_service.get_user_response(user)
        
        logger.info(f"Nouvel utilisateur inscrit: {user.email}")
        
        return AuthResponse(
            token=token,
            user=user_response
        )
    except ValueError as e:
        logger.warning(f"Tentative d'inscription échouée: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=sanitize_error_message(str(e))
        )
    except Exception as e:
        logger.error(f"Erreur lors de l'inscription: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=sanitize_error_message("Erreur lors de l'inscription")
        )

@router.post("/login", response_model=AuthResponse)
async def login(
    user_data: UserLogin, 
    request: Request,
    db: Session = Depends(get_db)
):
    """Login user"""
    # Rate limiting pour la connexion
    rate_limit(request, limit_per_minute=10, limit_per_hour=100)
    
    auth_service = AuthService(db)
    
    try:
        user = auth_service.authenticate_user(user_data.email, user_data.password)
        token = auth_service.create_access_token(user)
        user_response = auth_service.get_user_response(user)
        
        logger.info(f"Connexion réussie: {user.email}")
        
        return AuthResponse(
            token=token,
            user=user_response
        )
    except ValueError as e:
        logger.warning(f"Tentative de connexion échouée pour {user_data.email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=sanitize_error_message(str(e)),
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Erreur lors de la connexion: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=sanitize_error_message("Erreur lors de la connexion")
        )

@router.post("/google", response_model=AuthResponse)
async def google_login(
    google_data: GoogleLogin, 
    request: Request,
    db: Session = Depends(get_db)
):
    """Login with Google OAuth"""
    # Rate limiting pour l'authentification Google
    rate_limit(request, limit_per_minute=10, limit_per_hour=100)
    
    auth_service = AuthService(db)
    
    try:
        # Authentifier l'utilisateur avec Google
        user = auth_service.authenticate_google_user(google_data.token)
        token = auth_service.create_access_token(user)
        user_response = auth_service.get_user_response(user)
        
        logger.info(f"Connexion Google réussie: {user.email}")
        
        return AuthResponse(
            token=token,
            user=user_response
        )
    except ValueError as e:
        logger.warning(f"Tentative de connexion Google échouée: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=sanitize_error_message(str(e))
        )
    except Exception as e:
        logger.error(f"Erreur lors de l'authentification Google: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=sanitize_error_message("Erreur lors de l'authentification Google")
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user information"""
    auth_service = AuthService(db)
    return auth_service.get_user_response(current_user)

@router.put("/profile", response_model=UserResponse)
async def update_profile(
    user_data: UserUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    auth_service = AuthService(db)
    
    try:
        # Update user name
        current_user.name = user_data.name
        db.commit()
        db.refresh(current_user)
        
        logger.info(f"Profil mis à jour: {current_user.email}")
        
        return auth_service.get_user_response(current_user)
    except Exception as e:
        logger.error(f"Erreur lors de la mise à jour du profil: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=sanitize_error_message("Erreur lors de la mise à jour du profil")
        )

@router.post("/change-password", response_model=UserResponse)
async def change_password(
    password_data: PasswordChange,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    # Validation du nouveau mot de passe
    if not validate_password(password_data.new_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Le nouveau mot de passe doit contenir au moins {settings.MIN_PASSWORD_LENGTH} caractères, "
                   f"une majuscule, une minuscule, un chiffre et un caractère spécial"
        )
    
    auth_service = AuthService(db)
    
    try:
        user = auth_service.change_password(
            current_user.id,
            password_data.current_password,
            password_data.new_password
        )
        
        logger.info(f"Mot de passe changé pour: {user.email}")
        
        return auth_service.get_user_response(user)
    except ValueError as e:
        logger.warning(f"Tentative de changement de mot de passe échouée pour {current_user.email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=sanitize_error_message(str(e))
        )
    except Exception as e:
        logger.error(f"Erreur lors du changement de mot de passe: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=sanitize_error_message("Erreur lors du changement de mot de passe")
        )

@router.delete("/profile")
async def delete_account(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete user account and all associated sandboxes"""
    try:
        # Empêcher la suppression des admins
        if current_user.has_role("admin"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Impossible de supprimer un compte administrateur"
            )
        
        # Utiliser le service pour supprimer l'utilisateur et ses sandboxes
        from app.services.user_service import UserService
        from app.services.sandbox_service import SandboxService
        from app.services.docker_service import DockerService
        
        user_email = current_user.email
        user_id = current_user.id
        
        # Récupérer toutes les sandboxes de l'utilisateur
        user_sandboxes = SandboxService.get_sandboxes_by_user_id(db, user_id)
        
        # Supprimer les conteneurs Docker de chaque sandbox
        docker_service = DockerService()
        deleted_containers = 0
        
        for sandbox in user_sandboxes:
            if sandbox.container_name:
                try:
                    # Déterminer le type de logiciel pour utiliser la bonne méthode de suppression
                    if sandbox.software_type_id:
                        # Utiliser la méthode générique pour les nouveaux types de logiciels
                        success = await docker_service.delete_iam_sandbox(sandbox.container_name)
                    else:
                        # Fallback pour les anciennes sandboxes Keycloak
                        success = await docker_service.delete_keycloak_container(sandbox.container_name)
                    
                    if success:
                        deleted_containers += 1
                        logger.info(f"Conteneur Docker supprimé: {sandbox.container_name}")
                    else:
                        logger.warning(f"Échec de la suppression du conteneur: {sandbox.container_name}")
                        
                except Exception as e:
                    logger.error(f"Erreur lors de la suppression du conteneur {sandbox.container_name}: {str(e)}")
                    # Continuer même si la suppression du conteneur échoue
        
        # Supprimer toutes les sandboxes de la base de données
        for sandbox in user_sandboxes:
            db.delete(sandbox)
        
        # Supprimer l'utilisateur
        db.delete(current_user)
        db.commit()
        
        logger.info(f"Compte supprimé: {user_email} avec {len(user_sandboxes)} sandboxes et {deleted_containers} conteneurs")
        
        return {"message": "Compte supprimé avec succès"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la suppression du compte: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=sanitize_error_message("Erreur lors de la suppression du compte")
        )

@router.post("/logout")
async def logout(
    current_user = Depends(get_current_user)
):
    """Logout user (client should remove token)"""
    logger.info(f"Déconnexion: {current_user.email}")
    return {"message": "Déconnexion réussie"} 