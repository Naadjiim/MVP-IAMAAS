from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.auth_service import AuthService
from app.schemas.auth import UserCreate, UserLogin, GoogleLogin, AuthResponse, UserResponse, UserUpdate
from app.core.security import get_current_user

router = APIRouter()

@router.post("/register", response_model=AuthResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    auth_service = AuthService(db)
    
    try:
        user = auth_service.create_user(user_data)
        token = auth_service.create_access_token(user)
        user_response = auth_service.get_user_response(user)
        
        return AuthResponse(
            token=token,
            user=user_response
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/login", response_model=AuthResponse)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Login user"""
    auth_service = AuthService(db)
    
    try:
        user = auth_service.authenticate_user(user_data.email, user_data.password)
        token = auth_service.create_access_token(user)
        user_response = auth_service.get_user_response(user)
        
        return AuthResponse(
            token=token,
            user=user_response
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )

@router.post("/google", response_model=AuthResponse)
async def google_login(google_data: GoogleLogin, db: Session = Depends(get_db)):
    """Login with Google OAuth"""
    auth_service = AuthService(db)
    
    try:
        # Authentifier l'utilisateur avec Google
        user = auth_service.authenticate_google_user(google_data.token)
        token = auth_service.create_access_token(user)
        user_response = auth_service.get_user_response(user)
        
        return AuthResponse(
            token=token,
            user=user_response
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de l'authentification Google"
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
    
    # Update user name
    current_user.name = user_data.name
    db.commit()
    db.refresh(current_user)
    return auth_service.get_user_response(current_user)

@router.post("/change-password", response_model=UserResponse)
async def change_password(
    password_data: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    auth_service = AuthService(db)
    
    try:
        user = auth_service.change_password(
            current_user.id,
            password_data["current_password"],
            password_data["new_password"]
        )
        return auth_service.get_user_response(user)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/profile")
async def delete_account(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete user account and all associated sandboxes"""
    auth_service = AuthService(db)
    
    # Delete user (sandboxes will be deleted automatically due to cascade)
    db.delete(current_user)
    db.commit()
    
    return {"message": "Account deleted successfully"}

@router.post("/logout")
async def logout():
    """Logout user (client should remove token)"""
    return {"message": "Successfully logged out"} 