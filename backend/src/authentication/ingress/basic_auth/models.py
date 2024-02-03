"""
Auth1 Ingress Models
"""
from typing import Optional
from pydantic import BaseModel


class Token(BaseModel):
    """
    Token model for JWT token pair (access token and refresh token).
    """

    access_token: str
    token_type: Optional[str] = "bearer"
    refresh_token: Optional[str] = None
