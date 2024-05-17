from typing import Annotated

from bson import ObjectId
from fastapi import Depends

from src.common.models import ObjectIdPydanticAnnotation
from src.google.google_api_client import GoogleApiClient
from src.google.google_oath import GoogleOauthService
from src.google.models import GoogleOAuthCredentials
from src.link_mail_address.models import (
    EmailType,
    LinkMailAddress,
    LinkMailRequest,
    LinkMailAddressResponse,
    OauthTokenResponse,
    RedirectLinkResponse,
    LinkMailAddressUpdateRequest,
)

from src.link_mail_address.repositories import LinkMailAddressRepository


class LinkMailAddressService:
    def __init__(
        self,
        link_mail_address_repository: Annotated[LinkMailAddressRepository, Depends()],
        google_oauth: Annotated[GoogleOauthService, Depends()],
    ):
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
        user = GoogleApiClient(credentials, "_").get_user_info()
        data = LinkMailAddress(
            **{
                "username": username,
                "email": user.email,
                "picture": user.picture,
                "email_type": request_body.email_type,
                "oauth_tokens": credentials.dict(),
                "email_name": user.name,
            }
        )
        await self.link_mail_address_repository.save_credentials(data)
        return {"message": "Email linked successfully"}

    async def get_all_oauth_tokens(self, username: str) -> list[OauthTokenResponse]:
        oauth_tokens = await self.link_mail_address_repository.get_all_oauth_tokens(username)
        return oauth_tokens

    async def get_oauth_token_by_email(self, username: str, email: str) -> GoogleOAuthCredentials:
        return GoogleOAuthCredentials(
            **await self.link_mail_address_repository.get_oauth_token_by_email(username, email)
        )

    async def get_by_id(self, _id: Annotated[ObjectId, ObjectIdPydanticAnnotation]) -> LinkMailAddress:
        return LinkMailAddress(**await self.link_mail_address_repository.get_by_id(_id))

    async def get_by_email(self, username: str, email: str) -> dict:
        return await self.link_mail_address_repository.get_by_email(username, email)

    async def get_all_linked_mail_address(self, username: str) -> list[LinkMailAddressResponse]:
        response = await self.link_mail_address_repository.get_all_linked_mail_address(username)
        if not response:
            return []
        return [LinkMailAddressResponse(**{**doc, "id": doc.get("_id")}) for doc in response]

    async def unlink_mail_address(
        self,
        username: str,
        email: str,
    ) -> None:
        await self.link_mail_address_repository.unlink_mail_address(username, email)

    async def update_linked_mail_address_by_email(
        self, username: str, email: str, request_body: LinkMailAddressUpdateRequest
    ) -> None:
        link_mail_address = await self.link_mail_address_repository.get_by_email(username, email)
        await self.link_mail_address_repository.update_linked_mail_address(link_mail_address["_id"], request_body)

    async def update_linked_mail_address(
        self,
        linked_mail_address_id: Annotated[ObjectId, ObjectIdPydanticAnnotation],
        request_body: LinkMailAddressUpdateRequest,
    ) -> None:
        await self.link_mail_address_repository.update_linked_mail_address(linked_mail_address_id, request_body)
