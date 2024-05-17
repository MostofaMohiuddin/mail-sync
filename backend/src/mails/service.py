import asyncio
import time
from typing import Annotated, Any

from bson import ObjectId
from fastapi import Depends

from dateutil.parser import parse

from src.common.models import ObjectIdPydanticAnnotation
from src.google.google_api_client import GoogleApiClient
from src.google.models import GoogleOAuthCredentials
from src.link_mail_address.models import LinkMailAddressUpdateRequest
from src.link_mail_address.service import LinkMailAddressService
from src.openai.openai_client import OpenAIClient

from src.mails.models import (
    MailRequestBody,
    ProcessMailWithAIRequestBody,
    ProcessMailWithAIRequestType,
)


class MailSyncService:
    def __init__(
        self, link_mail_address_service: LinkMailAddressService = Depends(), openai_client: OpenAIClient = Depends()
    ):
        self.link_mail_address_service = link_mail_address_service
        self.openai_client = openai_client

    async def get_mails(self, username: str, next_page_tokens_query=None) -> Any:
        start = time.time()
        # next_page_tokens_query = "email1,token1;email2,token2"
        next_page_tokens = (
            {x[0]: x[1] for x in [x.split(",") for x in next_page_tokens_query.split(";")]}
            if next_page_tokens_query
            else {}
        )
        print("next_page_tokens", next_page_tokens_query)
        oauth_tokens = await self.link_mail_address_service.get_all_oauth_tokens(username)
        google_api_clients = [
            GoogleApiClient(
                GoogleOAuthCredentials(**token.oauth_tokens),
                token.email,
            )
            for token in oauth_tokens
        ]
        data = [client.get_user_mails(next_page_tokens.get(client.gmail, None)) for client in google_api_clients]
        mails = []
        tasks_update_linked_mail_address_by_email = []
        for d in data:
            tasks_update_linked_mail_address_by_email.append(
                self.link_mail_address_service.update_linked_mail_address_by_email(
                    username,
                    d.receiver.lower(),
                    LinkMailAddressUpdateRequest(
                        last_read_mail_id=d.emails[0].id, last_read_mail_history_id=d.emails[0].history_id
                    ),
                )
            )
            mails.extend(d.emails)

        end = time.time()
        print(f"Time taken: {end - start}")
        # mails = [email for d in data for email in d.emails]
        mails.sort(key=lambda x: parse(x.date), reverse=True)  # Sort the mails list

        new_next_page_tokens = [
            {"next_page_token": d.next_page_token, "email": d.receiver} for d in data if d.next_page_token
        ]
        await asyncio.gather(*tasks_update_linked_mail_address_by_email)
        return {"mails": mails, "next_page_tokens": new_next_page_tokens}

    async def get_mails_by_link_mail_address(
        self, username: str, link_mail_address: str, next_page_token: str = None, number_of_mails: int = 10
    ) -> Any:
        oauth_tokens = await self.link_mail_address_service.get_oauth_token_by_email(username, link_mail_address)
        if not oauth_tokens:
            return {"mails": []}
        google_api_client = GoogleApiClient(oauth_tokens, link_mail_address)
        data = google_api_client.get_user_mails(next_page_token, number_of_mails)
        await self.link_mail_address_service.update_linked_mail_address_by_email(
            username,
            link_mail_address,
            LinkMailAddressUpdateRequest(
                last_read_mail_id=data.emails[0].id, last_read_mail_history_id=data.emails[0].history_id
            ),
        )
        return {"mails": data.emails, "next_page_token": data.next_page_token}

    async def get_mails_by_link_address_id(
        self,
        link_address_id: Annotated[ObjectId, ObjectIdPydanticAnnotation],
        next_page_tokens_query=None,
        number_of_mails: int = 10,
    ) -> Any:
        start = time.time()
        # next_page_tokens_query = "email1,token1;email2,token2"
        next_page_tokens = (
            {x[0]: x[1] for x in [x.split(",") for x in next_page_tokens_query.split(";")]}
            if next_page_tokens_query
            else {}
        )
        print("next_page_tokens", next_page_tokens_query)
        link_address_data = await self.link_mail_address_service.get_by_id(link_address_id)
        if not link_address_data:
            return {"mails": [], "next_page_token": None}
        print("link_address_data", link_address_data.oauth_tokens)
        oauth_tokens = GoogleOAuthCredentials(**link_address_data.oauth_tokens)
        google_api_client = GoogleApiClient(oauth_tokens, link_address_data.email)
        data = google_api_client.get_user_mails(next_page_tokens.get(link_address_data.email, None), number_of_mails)

        end = time.time()
        print(f"Time taken: {end - start}")
        await self.link_mail_address_service.update_linked_mail_address(
            linked_mail_address_id=link_address_id,
            request_body=LinkMailAddressUpdateRequest(
                last_read_mail_id=data.emails[0].id, last_read_mail_history_id=data.emails[0].history_id
            ),
        )
        return {"mails": data.emails, "next_page_token": data.next_page_token}

    async def get_mail(self, username: str, mail_id: str, mail_address: str) -> Any:
        oauth_token = await self.link_mail_address_service.get_oauth_token_by_email(username, mail_address)
        google_api_client = GoogleApiClient(oauth_token, mail_address)
        return google_api_client.get_user_mail(mail_id)

    async def get_mail_by_link_address_id(
        self,
        link_address_id: Annotated[ObjectId, ObjectIdPydanticAnnotation],
        mail_id: str,
        mail_format: str = "full",
    ) -> Any:
        link_address_data = await self.link_mail_address_service.get_by_id(link_address_id)
        if not link_address_data:
            return {"mail": {}}
        oauth_tokens = GoogleOAuthCredentials(**link_address_data.oauth_tokens)
        google_api_client = GoogleApiClient(oauth_tokens, link_address_data.email)
        return google_api_client.get_user_mail(mail_id, mail_format)

    async def send_mail(self, username: str, message: MailRequestBody) -> dict:
        oauth_token = await self.link_mail_address_service.get_oauth_token_by_email(username, message.sender)
        google_api_client = GoogleApiClient(oauth_token, message.sender)
        return google_api_client.send_mail(message)
        # print(get_completion(f"You are a mail writer. Please help me write a reply to the mail: {message.message}"))
        # return {"message": "Mail sent successfully"}

    async def send_mail_by_link_address_id(
        self, link_address_id: Annotated[ObjectId, ObjectIdPydanticAnnotation], message: MailRequestBody
    ) -> dict:
        link_address_data = await self.link_mail_address_service.get_by_id(link_address_id)
        if not link_address_data:
            return {"message": "Link address not found"}
        oauth_tokens = GoogleOAuthCredentials(**link_address_data.oauth_tokens)
        google_api_client = GoogleApiClient(oauth_tokens, link_address_data.email)
        return google_api_client.send_mail(message)

    def _generate_prompt(self, request: ProcessMailWithAIRequestBody) -> dict:
        prompts = {
            ProcessMailWithAIRequestType.GENERATE: {
                "system_prompt": "You are an email generator. Given a message, you generate an email. use div tag for new line.",
                "prompt": f"Please generate an email for the message: {request.message}",
            },
            ProcessMailWithAIRequestType.SUMMARY: {
                "system_prompt": "You are a mail summarizer. You summarize the mail. and reply in bullet points. use div tag for each point.",
                "prompt": f"Please help summarize the email: {request.message}.",
            },
            ProcessMailWithAIRequestType.REPLY: {
                "system_prompt": "You are a mail writer. You write a reply to the mail. and use div tag for new line.",
                "prompt": f"Please help me write a reply to the email: {request.message}",
            },
        }

        # Get the prompt based on the request type
        return prompts.get(request.request_type, prompts[ProcessMailWithAIRequestType.GENERATE])

    async def process_mail_with_ai(
        self,
        request: ProcessMailWithAIRequestBody,
    ) -> dict:
        prompt = self._generate_prompt(request)
        processed_mail = self.openai_client.get_completion(**prompt)
        return {"processed_mail": processed_mail}

    async def get_mail_history(
        self,
        link_mail_address_id: Annotated[ObjectId, ObjectIdPydanticAnnotation],
        mail_history_id: str,
        next_page_token: str,
    ) -> Any:
        link_address_data = await self.link_mail_address_service.get_by_id(link_mail_address_id)
        if not link_address_data:
            return {"mails": []}
        oauth_tokens = GoogleOAuthCredentials(**link_address_data.oauth_tokens)
        google_api_client = GoogleApiClient(oauth_tokens, link_address_data.email)
        google_response = google_api_client.get_user_mail_history(mail_history_id, next_page_token)
        history = google_response.get("history", [])
        mailsAdded = []
        for item in history:
            messagesAdded = item.get("messagesAdded", [])
            for message in messagesAdded:
                mail = google_api_client.get_user_mail(message.get("message", {}).get("id"), mail_format="metadata")
                mailsAdded.append(mail)
        return {"mailsAdded": mailsAdded, "next_page_token": google_response.get("nextPageToken")}
