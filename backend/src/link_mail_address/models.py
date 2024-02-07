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
    picture: Optional[str] = None
    email_type: EmailType
    credentials: dict

    @model_serializer
    def to_dict(self):
        return {
            "username": self.username,
            "email": self.email,
            "picture": self.picture,
            "email_type": self.email_type.value,
            "credentials": self.credentials,
        }
