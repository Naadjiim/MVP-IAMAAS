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
        
        return AuthResponse(
            token=token,
            user=UserResponse.from_orm(user)
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
    
    user = auth_service.authenticate_user(user_data.email, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = auth_service.create_access_token(user)
    
    return AuthResponse(
        token=token,
        user=UserResponse.from_orm(user)
    )

@router.post("/google", response_model=AuthResponse)
async def google_login(google_data: GoogleLogin, db: Session = Depends(get_db)):
    """Login with Google OAuth (simulated for MVP)"""
    auth_service = AuthService(db)
    
    # For MVP, we'll simulate Google OAuth
    # In production, you would verify the Google token
    mock_google_user = {
        "email": "google@example.com",
        "name": "Utilisateur Google",
        "google_id": "google-123",
        "avatar_url": "https://via.placeholder.com/32"
    }
    
    user = auth_service.create_google_user(
        email=mock_google_user["email"],
        name=mock_google_user["name"],
        google_id=mock_google_user["google_id"],
        avatar_url=mock_google_user["avatar_url"]
    )
    
    token = auth_service.create_access_token(user)
    
    return AuthResponse(
        token=token,
        user=UserResponse.from_orm(user)
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse.from_orm(current_user)

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
    
    return UserResponse.from_orm(current_user)

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