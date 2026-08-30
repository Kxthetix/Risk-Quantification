from datetime import datetime
from typing import Optional
import uuid
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.user import UserRole


class UserBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255, description="Full name of user")
    email: str = Field(..., min_length=3, max_length=255, description="User email address")

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if not v or "@" not in str(v):
            raise ValueError("Invalid email address format")
        return str(v).lower().strip()


class UserRegister(UserBase):
    """Payload for user and initial organization self-registration."""
    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="Password (minimum 8 characters)",
    )
    organization_name: str = Field(
        ...,
        min_length=2,
        max_length=255,
        description="Name of the organization to create or join",
    )
    industry: Optional[str] = Field(None, max_length=100, description="Industry sector")
    description: Optional[str] = Field(None, max_length=1000, description="Organization description")

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return v


class UserCreate(UserBase):
    """Payload for creating a user within an existing organization by Admin."""
    password: str = Field(..., min_length=8, max_length=128)
    role: UserRole = Field(default=UserRole.VIEWER)
    organization_id: Optional[uuid.UUID] = None


class UserLogin(BaseModel):
    """Payload for user login."""
    email: str = Field(..., min_length=3, max_length=255, description="User email address")
    password: str = Field(..., min_length=1, description="Plaintext password")

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if not v or "@" not in str(v):
            raise ValueError("Invalid email address format")
        return str(v).lower().strip()


class UserUpdate(BaseModel):
    """Payload for updating user profile or status."""
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    """Safe public user representation without sensitive fields."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime


class TokenResponse(BaseModel):
    """JWT bearer token response with refresh token."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    refresh_token: Optional[str] = None
    refresh_expires_in: Optional[int] = None


class RefreshTokenRequest(BaseModel):
    """Request payload to exchange a refresh token for a new token pair."""
    refresh_token: str = Field(..., description="Active refresh token")


class UserSessionResponse(BaseModel):
    """Active user session representation."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    device_info: Optional[str] = None
    ip_address: Optional[str] = None
    expires_at: datetime
    revoked: bool
    created_at: datetime


class TokenPayload(BaseModel):
    """Decoded JWT payload structure."""
    sub: str
    organization_id: str
    role: str
    exp: int
    iat: Optional[int] = None
    jti: Optional[str] = None
    type: Optional[str] = None
