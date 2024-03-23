from typing import List, Optional

from pydantic import BaseModel


class GoogleOAuthCredentials(BaseModel):
    token: str
    refresh_token: str
    token_uri: str
    client_id: str
    client_secret: str
    scopes: List[str]


class UserInfo(BaseModel):
    email: str
    picture: Optional[str] = None
    name: Optional[str] = None


class EmailMetadata(BaseModel):
    sender: UserInfo
    receiver: UserInfo
    subject: str
    date: str
    snippet: str
    id: str
    history_id: str


class GmailMetadataList(BaseModel):
    emails: List[EmailMetadata]
    next_page_token: Optional[str] = None
    receiver: str


class EmailBody(BaseModel):
    html: Optional[str] = None
    plain: Optional[str] = None


class EmailFullData(EmailMetadata):
    body: EmailBody
