from fastapi import Depends, Security
import googleapiclient.discovery
import asyncio

from aiogoogle import Aiogoogle

import google.oauth2.credentials

from fastapi_jwt import JwtAuthorizationCredentials
from src.link_mail_address.repositories import LinkMailAddressRepository

from .models import GoogleOAuthCredentials, UserInfo
from src.authentication.service import access_security
import threading
from concurrent.futures import ThreadPoolExecutor


class GoogleApiClient:
    def __init__(
        self,
        credentials: GoogleOAuthCredentials,
    ):
        self.google_oauth_credentials = google.oauth2.credentials.Credentials(**credentials.dict())

    def get_user_info(self) -> UserInfo:
        service = googleapiclient.discovery.build("oauth2", "v2", credentials=self.google_oauth_credentials)
        user = service.userinfo().get().execute()
        return UserInfo(**user)

    async def get_user_mails(self):
        service = googleapiclient.discovery.build("gmail", "v1", credentials=self.google_oauth_credentials)
        response = service.users().messages().list(userId="me", maxResults=5).execute()
        message_list = response.get("messages", [])
        return [
            service.users().messages().get(userId="me", id=message["id"], format="full").execute()
            for message in message_list
        ]


async def get_google_oauth_credentials(
    email: str,
    jwt_credentials: JwtAuthorizationCredentials = Security(access_security),
    link_mail_address_repository: LinkMailAddressRepository = Depends(),
) -> GoogleOAuthCredentials:
    username = jwt_credentials.subject.get("username")
    return GoogleOAuthCredentials(**await link_mail_address_repository.get_tokens(username, email))


async def get_google_api_client(
    credentials: GoogleOAuthCredentials = Depends(get_google_oauth_credentials),
) -> GoogleApiClient:
    return GoogleApiClient(credentials)
