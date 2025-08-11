from functools import wraps
from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import re
import time
from collections import defaultdict
from app.database import get_db
from app.models.user import User
from app.services.auth_service import AuthService
from app.core.config import settings

security = HTTPBearer()

# Rate limiting storage (en production, utiliser Redis)
rate_limit_storage = defaultdict(list)

def validate_password(password: str) -> bool:
    """Valide un mot de passe selon la politique de sécurité"""
    if len(password) < settings.MIN_PASSWORD_LENGTH:
        return False
    
    if settings.REQUIRE_UPPERCASE and not re.search(r'[A-Z]', password):
        return False
    
    if settings.REQUIRE_LOWERCASE and not re.search(r'[a-z]', password):
        return False
    
    if settings.REQUIRE_DIGIT and not re.search(r'\d', password):
        return False
    
    if settings.REQUIRE_SPECIAL_CHAR and not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False
    
    return True

def rate_limit(request: Request, limit_per_minute: int = None, limit_per_hour: int = None):
    """Middleware de rate limiting"""
    client_ip = request.client.host
    current_time = time.time()
    
    # Nettoyer les anciennes entrées
    rate_limit_storage[client_ip] = [
        timestamp for timestamp in rate_limit_storage[client_ip]
        if current_time - timestamp < 3600  # Garder 1 heure
    ]
    
    # Vérifier la limite par minute
    if limit_per_minute:
        minute_ago = current_time - 60
        requests_last_minute = len([
            timestamp for timestamp in rate_limit_storage[client_ip]
            if timestamp > minute_ago
        ])
        
        if requests_last_minute >= limit_per_minute:
            raise HTTPException(
                status_code=429,
                detail="Trop de requêtes. Veuillez réessayer plus tard."
            )
    
    # Vérifier la limite par heure
    if limit_per_hour:
        hour_ago = current_time - 3600
        requests_last_hour = len([
            timestamp for timestamp in rate_limit_storage[client_ip]
            if timestamp > hour_ago
        ])
        
        if requests_last_hour >= limit_per_hour:
            raise HTTPException(
                status_code=429,
                detail="Limite horaire dépassée. Veuillez réessayer plus tard."
            )
    
    # Ajouter la requête actuelle
    rate_limit_storage[client_ip].append(current_time)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Get current authenticated user"""
    try:
        auth_service = AuthService(db)
        payload = auth_service.verify_token(credentials.credentials)
        
        if not payload:
            raise HTTPException(
                status_code=401,
                detail="Token invalide ou expiré",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user = auth_service.get_user_by_id(payload.get("sub"))
        if not user:
            raise HTTPException(
                status_code=401,
                detail="Utilisateur non trouvé",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=401,
                detail="Compte désactivé",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return user
    except HTTPException:
        raise
    except Exception as e:
        # Log l'erreur pour le debugging mais ne pas exposer les détails
        if settings.DEBUG:
            raise HTTPException(status_code=500, detail=str(e))
        else:
            raise HTTPException(status_code=500, detail="Erreur interne du serveur")

def require_role(required_role: str):
    """Décorateur pour vérifier le rôle de l'utilisateur"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Récupérer l'utilisateur courant
            current_user = kwargs.get('current_user')
            if not current_user:
                raise HTTPException(status_code=401, detail="Utilisateur non authentifié")
            
            # Vérifier le rôle
            if not current_user.has_role(required_role):
                raise HTTPException(
                    status_code=403, 
                    detail="Accès refusé - privilèges insuffisants"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

def require_admin():
    """Décorateur pour vérifier que l'utilisateur est admin"""
    return require_role("admin")

def get_current_admin_user(current_user = Depends(get_current_user)):
    """Dépendance pour récupérer l'utilisateur admin courant"""
    if not current_user.is_admin():
        raise HTTPException(
            status_code=403, 
            detail="Accès refusé - rôle administrateur requis"
        )
    return current_user

def sanitize_error_message(message: str) -> str:
    """Nettoie les messages d'erreur pour éviter l'exposition d'informations sensibles"""
    if not settings.DEBUG:
        # En production, ne pas exposer les détails techniques
        sensitive_patterns = [
            r'password',
            r'token',
            r'secret',
            r'key',
            r'credential',
            r'database',
            r'connection'
        ]
        
        for pattern in sensitive_patterns:
            if re.search(pattern, message, re.IGNORECASE):
                return "Erreur de configuration"
    
    return message 