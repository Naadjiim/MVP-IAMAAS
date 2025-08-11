from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    
    @validator('name')
    def validate_name(cls, v):
        if len(v.strip()) < 2:
            raise ValueError('Le nom doit contenir au moins 2 caractères')
        if len(v.strip()) > 100:
            raise ValueError('Le nom ne peut pas dépasser 100 caractères')
        return v.strip()

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleLogin(BaseModel):
    token: str

class PasswordChange(BaseModel):
    current_password: str
    new_password: str
    
    @validator('current_password', 'new_password')
    def validate_password_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Le mot de passe ne peut pas être vide')
        return v

class AuthResponse(BaseModel):
    token: str
    user: 'UserResponse'

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    is_active: bool
    is_verified: bool
    avatar_url: Optional[str] = None
    google_id: Optional[str] = None
    roles: List[str]
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: str
    
    @validator('name')
    def validate_name(cls, v):
        if len(v.strip()) < 2:
            raise ValueError('Le nom doit contenir au moins 2 caractères')
        if len(v.strip()) > 100:
            raise ValueError('Le nom ne peut pas dépasser 100 caractères')
        return v.strip()

# Pour éviter les erreurs de référence circulaire
AuthResponse.model_rebuild() 