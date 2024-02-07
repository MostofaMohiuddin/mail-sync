from fastapi import Depends
from typing import Any
from src.link_mail_address.service import LinkMailAddressService
from src.google.models import GoogleOAuthCredentials
from src.google.google_api_client import GoogleApiClient, get_google_api_client


class MailSyncService:
    def __init__(
        self,
        link_mail_address_service: LinkMailAddressService = Depends(),
        google_api_client: GoogleApiClient = Depends(get_google_api_client),
    ):
        self.link_mail_address_service = link_mail_address_service
        self.google_api_client = google_api_client

    async def get_mails(self) -> Any:
        return await self.google_api_client.get_user_mails()
