from functools import wraps
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import UserRole, User
from app.services.auth_service import AuthService

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Get current authenticated user"""
    auth_service = AuthService(db)
    payload = auth_service.verify_token(credentials.credentials)
    
    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = auth_service.get_user_by_id(payload.get("sub"))
    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

def require_role(required_role: UserRole):
    """Décorateur pour vérifier le rôle de l'utilisateur"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Récupérer l'utilisateur courant
            current_user = kwargs.get('current_user')
            if not current_user:
                raise HTTPException(status_code=401, detail="Utilisateur non authentifié")
            
            # Vérifier le rôle
            if current_user.role != required_role:
                raise HTTPException(status_code=403, detail="Accès refusé - rôle insuffisant")
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

def require_admin():
    """Décorateur pour vérifier que l'utilisateur est admin"""
    return require_role(UserRole.ADMIN)

def get_current_admin_user(current_user = Depends(get_current_user)):
    """Dépendance pour récupérer l'utilisateur admin courant"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Accès refusé - rôle admin requis")
    return current_user 