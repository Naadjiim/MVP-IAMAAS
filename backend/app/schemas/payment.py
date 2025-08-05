from pydantic import BaseModel
from typing import Optional

class PaymentIntentCreate(BaseModel):
    amount: float
    currency: str = "eur"
    sandbox_id: str

class PaymentIntentResponse(BaseModel):
    id: str
    client_secret: str
    amount: int
    currency: str
    status: str

class PaymentConfirm(BaseModel):
    payment_intent_id: str
    sandbox_id: str

class PaymentStatus(BaseModel):
    payment_intent_id: str
    status: str
    amount: int
    currency: str

class StripeWebhook(BaseModel):
    id: str
    type: str
    data: dict 