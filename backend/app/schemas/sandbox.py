from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from app.models.sandbox import SandboxStatus, SoftwareType

class SandboxBase(BaseModel):
    name: str
    email: EmailStr
    duration_hours: int
    description: Optional[str] = None
    software_type: SoftwareType = SoftwareType.keycloak

class SandboxCreate(SandboxBase):
    email: Optional[str] = None  # Optionnel car on utilisera l'email de l'utilisateur connecté

class SandboxUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    duration_hours: Optional[int] = None
    description: Optional[str] = None
    software_type: Optional[SoftwareType] = None

class SandboxResponse(SandboxBase):
    id: str
    status: SandboxStatus
    price: float
    user_id: str
    container_id: Optional[str] = None
    access_url: Optional[str] = None
    admin_username: Optional[str] = None
    created_at: datetime
    expires_at: datetime
    duration_hours: int

    class Config:
        from_attributes = True 