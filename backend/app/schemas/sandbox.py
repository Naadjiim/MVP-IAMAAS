from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class SandboxBase(BaseModel):
    name: str
    email: EmailStr
    duration_hours: int
    description: Optional[str] = None
    software_type_id: str

class SandboxCreate(SandboxBase):
    email: Optional[str] = None  # Optionnel car on utilisera l'email de l'utilisateur connecté

class SandboxUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    duration_hours: Optional[int] = None
    description: Optional[str] = None
    software_type_id: Optional[str] = None

class PaymentIntentResponse(BaseModel):
    payment_intent_id: str
    client_secret: str
    amount: int  # Montant en centimes
    currency: str
    sandbox_id: Optional[str] = None  # Optionnel car la sandbox n'existe pas encore

class SandboxResponse(SandboxBase):
    id: str
    status: str
    price: float
    user_id: str
    software_type_id: str
    container_id: Optional[str] = None
    access_url: Optional[str] = None
    admin_username: Optional[str] = None
    admin_password: Optional[str] = None
    stripe_payment_intent_id: Optional[str] = None
    payment_status: Optional[str] = None
    created_at: datetime
    expires_at: datetime
    duration_hours: int

    class Config:
        from_attributes = True 