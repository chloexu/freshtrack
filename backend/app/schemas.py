from datetime import date, datetime
from typing import Optional, Literal
from uuid import UUID
from pydantic import BaseModel, ConfigDict


# --- Auth ---

class RegisterRequest(BaseModel):
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    token: str


# --- Items ---

class ItemCreate(BaseModel):
    name: str
    quantity: Optional[str] = None
    purchase_date: date
    predicted_expiry: date


class ItemCreateBatch(BaseModel):
    items: list[ItemCreate]


class ItemUpdate(BaseModel):
    name: Optional[str] = None
    quantity: Optional[str] = None
    predicted_expiry: Optional[date] = None
    status: Optional[Literal["in_fridge", "consumed", "discarded"]] = None


class ItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    name: str
    quantity: Optional[str] = None
    purchase_date: date
    predicted_expiry: date
    status: str
    status_at: Optional[datetime] = None
    created_at: datetime


# --- Receipt Parsing ---

class ParseReceiptRequest(BaseModel):
    image_base64: str


class ParsedItem(BaseModel):
    name: str
    quantity: Optional[str] = None
    predicted_expiry_days: int
    confidence: Literal["high", "medium", "low"]


class ParseReceiptResponse(BaseModel):
    items: list[ParsedItem]
    parse_notes: Optional[str] = None
