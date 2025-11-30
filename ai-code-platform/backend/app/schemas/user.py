from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class CamelModel(BaseModel):
    class Config:
        allow_population_by_field_name = True
        populate_by_name = True
        orm_mode = True


class UserBase(CamelModel):
    email: EmailStr
    name: str
    role: Optional[str] = "developer"
    avatar_url: Optional[str] = Field(None, alias="avatarUrl")
    bio: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(CamelModel):
    name: Optional[str] = None
    role: Optional[str] = None
    avatar_url: Optional[str] = Field(None, alias="avatarUrl")
    bio: Optional[str] = None


class UserResponse(UserBase):
    id: str
    is_active: bool = Field(..., alias="isActive")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: Optional[datetime] = Field(None, alias="updatedAt")


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[str] = None

