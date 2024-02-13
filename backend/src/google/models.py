from typing import List

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
    picture: str
    name: str
