from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PricingBase(BaseModel):
    software_type_id: str
    duration_hours: int
    price: float
    is_active: str = "true"

class PricingCreate(PricingBase):
    pass

class PricingUpdate(BaseModel):
    software_type_id: Optional[str] = None
    duration_hours: Optional[int] = None
    price: Optional[float] = None
    is_active: Optional[str] = None

class PricingResponse(PricingBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True 