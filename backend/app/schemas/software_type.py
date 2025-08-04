from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class SoftwareTypeBase(BaseModel):
    name: str
    description: Optional[str] = None
    base_price_per_hour: float = 0.0
    is_active: str = "true"

class SoftwareTypeCreate(SoftwareTypeBase):
    pass

class SoftwareTypeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    base_price_per_hour: Optional[float] = None
    is_active: Optional[str] = None

class SoftwareTypeResponse(SoftwareTypeBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

 