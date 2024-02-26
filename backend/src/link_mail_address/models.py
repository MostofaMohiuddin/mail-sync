from enum import Enum
from typing import Optional

from pydantic import BaseModel, model_serializer


class EmailType(Enum):
    GMAIL = "gmail"


class RedirectLinkResponse(BaseModel):
    redirect_link: str


class LinkMailRequest(BaseModel):
    email_type: EmailType
    code: str


class LinkMailAddress(BaseModel):
    username: str
    email: str
    email_name: str
    picture: Optional[str] = None
    email_type: EmailType
    oauth_tokens: dict

    @model_serializer
    def to_dict(self):
        return {
            "username": self.username,
            "email": self.email,
            "picture": self.picture,
            "email_type": self.email_type.value,
            "oauth_tokens": self.oauth_tokens,
            "email_name": self.email_name,
        }


class OauthTokenResponse(BaseModel):
    oauth_tokens: dict
    email: str


class LinkMailAddressResponse(BaseModel):
    username: str
    email: str
    email_name: str
    picture: Optional[str] = None
