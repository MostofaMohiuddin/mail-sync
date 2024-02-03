from typing import Optional
from pydantic import BaseModel


class User(BaseModel):
    username: str
    password: str


class UserUpdate(BaseModel):
    password: Optional[str] = None


class UserResponse(BaseModel):
    username: str
