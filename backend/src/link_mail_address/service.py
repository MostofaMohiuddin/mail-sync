from typing import Annotated

from fastapi import Depends

from src.authentication.service import PasswordBasedAuthentication
from src.google.google_api_client import GoogleApiClient
from src.google.google_oath import GoogleOauthService
from src.google.models import GoogleOAuthCredentials
from src.link_mail_address.models import (
    EmailType,
    LinkMailAddress,
    LinkMailRequest,
    OauthTokensResponse,
    RedirectLinkResponse,
)

from .repositories import LinkMailAddressRepository


class LinkMailAddressService:
    def __init__(
        self,
        link_mail_address_repository: Annotated[LinkMailAddressRepository, Depends()],
        google_oauth: Annotated[GoogleOauthService, Depends()],
        auth: Annotated[PasswordBasedAuthentication, Depends()],
    ):
        self.auth = auth
        self.google_oauth = google_oauth
        self.link_mail_address_repository = link_mail_address_repository

    def create_oauth_url(self, email_type: EmailType) -> RedirectLinkResponse:
        return (
            RedirectLinkResponse(redirect_link=self.google_oauth.get_auth_url())
            if email_type == EmailType.GMAIL
            else None
        )

    async def save_oauth_tokens(self, username: str, request_body: LinkMailRequest) -> dict:
        credentials = self.google_oauth.get_google_oauth_credentials(request_body.code)
        user = GoogleApiClient(credentials).get_user_info()
        data = LinkMailAddress(
            **{
                "username": username,
                "email": user.email,
                "picture": user.picture,
                "email_type": request_body.email_type,
                "oauth_tokens": credentials.dict(),
            }
        )
        await self.link_mail_address_repository.save_credentials(data)
        return {"message": "Email linked successfully"}

    async def get_all_oauth_tokens(self, username: str) -> OauthTokensResponse:
        documents = await self.link_mail_address_repository.get_all_oauth_tokens(username)
        return OauthTokensResponse(**{"oauth_tokens": documents})

    async def get_oauth_token_by_email(self, username: str, email: str) -> GoogleOAuthCredentials:
        return GoogleOAuthCredentials(
            **await self.link_mail_address_repository.get_oauth_token_by_email(username, email)
        )
