import time
from typing import Any

from fastapi import Depends, Security
from fastapi_jwt import JwtAuthorizationCredentials

from src.authentication.service import access_security
from src.google.google_api_client import get_google_api_client
from src.google.models import GoogleOAuthCredentials
from src.link_mail_address.service import LinkMailAddressService
from src.openai.openai_client import OpenAIClient

from .models import (
    MailRequestBody,
    ProcessMailWithAIRequestBody,
    ProcessMailWithAIRequestType,
)


class MailSyncService:
    def __init__(
        self,
        link_mail_address_service: LinkMailAddressService = Depends(),
        openai_client: OpenAIClient = Depends(),
        jwt_credentials: JwtAuthorizationCredentials = Security(access_security),
    ):
        self.link_mail_address_service = link_mail_address_service
        self.openai_client = openai_client
        self.username = jwt_credentials.subject.get("username")

    async def get_mails(self) -> Any:
        start = time.time()
        oauth_tokens = await self.link_mail_address_service.get_all_oauth_tokens(self.username)
        google_api_clients = [
            get_google_api_client(GoogleOAuthCredentials(**token)) for token in oauth_tokens.oauth_tokens
        ]
        data = (user_mails for client in google_api_clients for user_mails in client.get_user_mails())

        end = time.time()
        print(f"Time taken: {end - start}")
        return data

    async def get_mail(self, mail_id: str, mail_address: str) -> Any:
        oauth_token = await self.link_mail_address_service.get_oauth_token_by_email(self.username, mail_address)
        google_api_client = get_google_api_client(oauth_token)
        return google_api_client.get_user_mail(mail_id)

    async def send_mail(self, message: MailRequestBody) -> dict:
        oauth_token = await self.link_mail_address_service.get_oauth_token_by_email(self.username, message.sender)
        google_api_client = get_google_api_client(oauth_token)
        return google_api_client.send_mail(message)
        # print(get_completion(f"You are a mail writer. Please help me write a reply to the mail: {message.message}"))
        # return {"message": "Mail sent successfully"}

    def _generate_prompt(self, request: ProcessMailWithAIRequestBody) -> str:
        return (
            f"You are a mail summarizer. Please help me by summarizing the mail: {request.message}."
            if request.request_type == ProcessMailWithAIRequestType.SUMMARY
            else f"You are a mail writer. Please help me write a reply to the mail: {request.message}. The reply will be sent by {self.username}"
        )

    async def process_mail_with_ai(
        self,
        request: ProcessMailWithAIRequestBody,
    ) -> dict:
        prompt = self._generate_prompt(request)
        processed_mail = self.openai_client.get_completion(content=prompt)
        return {"processed_mail": processed_mail}
