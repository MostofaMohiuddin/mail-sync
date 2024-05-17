from enum import Enum
from typing import Annotated, Optional

from bson import ObjectId
from pydantic import BaseModel, model_serializer

from src.common.models import ObjectIdPydanticAnnotation


class EmailType(Enum):
    GMAIL = "gmail"


class RedirectLinkResponse(BaseModel):
    redirect_link: str


class LinkMailRequest(BaseModel):
    email_type: EmailType
    code: str


class LinkMailAddressUpdateRequest(BaseModel):
    last_read_mail_id: Optional[str] = None
    last_read_mail_history_id: Optional[str] = None


class LinkMailAddress(BaseModel):
    username: str
    email: str
    email_name: str
    picture: Optional[str] = None
    email_type: EmailType
    oauth_tokens: dict
    last_read_mail_id: Optional[str] = None
    last_read_mail_history_id: Optional[str] = None

    @model_serializer
    def to_dict(self):
        return {
            "username": self.username,
            "email": self.email,
            "picture": self.picture,
            "email_type": self.email_type.value,
            "oauth_tokens": self.oauth_tokens,
            "email_name": self.email_name,
            "last_read_mail_id": self.last_read_mail_id,
            "last_read_mail_history_id": self.last_read_mail_history_id,
        }


class OauthTokenResponse(BaseModel):
    oauth_tokens: dict
    email: str


class LinkMailAddressResponse(BaseModel):
    id: Annotated[ObjectId, ObjectIdPydanticAnnotation]
    username: str
    email: str
    email_name: str
    picture: Optional[str] = None
