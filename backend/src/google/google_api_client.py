import base64
from concurrent.futures import ThreadPoolExecutor
from email.message import EmailMessage
from typing import List

import google_auth_httplib2
import httplib2
from fastapi import Depends, Security
from fastapi_jwt import JwtAuthorizationCredentials
from googleapiclient.discovery import build as googleapiclient_builder

import google.oauth2.credentials
from src.authentication.service import access_security
from src.common.exceptions.http import RequestTimeoutException
from src.link_mail_address.repositories import LinkMailAddressRepository
from src.logger.default_logger import LOGGER
from src.mails.models import MailRequestBody

from .models import GoogleOAuthCredentials, UserInfo


class GoogleApiClient:
    def __init__(
        self,
        credentials: GoogleOAuthCredentials,
    ):
        self.google_oauth_credentials = google.oauth2.credentials.Credentials(**credentials.dict())

    def _fetch_data_using_thread(self, services: list):
        with ThreadPoolExecutor(max_workers=5) as executor:
            http = google_auth_httplib2.AuthorizedHttp(self.google_oauth_credentials, http=httplib2.Http())
            futures = [executor.submit(service.execute, http=http) for service in services]
            return [future.result() for future in futures]

    def _batch_request(self, batch, services: list):
        result = []

        def _callback(request_id, response, exception):
            if exception:
                LOGGER.error(f"Error occurred while fetching data from google api, request id {request_id}")
                raise RequestTimeoutException(detail="Error occurred while fetching data from google api")
            else:
                result.append(response)

        for service in services:
            batch.add(service, callback=_callback)
        batch.execute()
        return result

    def get_user_info(self) -> UserInfo:
        service = googleapiclient_builder("oauth2", "v2", credentials=self.google_oauth_credentials)
        user = service.userinfo().get().execute()
        print(user)
        return UserInfo(**user)

    def get_user_mails(self):
        service = googleapiclient_builder("gmail", "v1", credentials=self.google_oauth_credentials)
        response = service.users().messages().list(userId="me", maxResults=5).execute()
        message_list = response.get("messages", [])
        services = [
            service.users().messages().get(userId="me", id=message["id"], format="full") for message in message_list
        ]
        batch = service.new_batch_http_request()
        return self._batch_request(batch, services)

    def send_mail(self, message: MailRequestBody):
        service = googleapiclient_builder("gmail", "v1", credentials=self.google_oauth_credentials)
        email = EmailMessage()
        email["to"] = message.receiver
        email["from"] = message.sender
        email["subject"] = message.subject
        email.set_content(message.message)
        # encoded message
        encoded_message = base64.urlsafe_b64encode(email.as_bytes()).decode()

        create_message = {"raw": encoded_message}

        return service.users().messages().send(userId="me", body=create_message).execute()


async def _get_google_oauth_credentials(
    email: str,
    jwt_credentials: JwtAuthorizationCredentials = Security(access_security),
    link_mail_address_repository: LinkMailAddressRepository = Depends(),
) -> GoogleOAuthCredentials:
    username = jwt_credentials.subject.get("username")
    return GoogleOAuthCredentials(**await link_mail_address_repository.get_tokens(username, email))


def get_google_api_client(credentials: GoogleOAuthCredentials) -> GoogleApiClient:
    return GoogleApiClient(credentials)


async def _get_all_google_oauth_credentials(
    jwt_credentials: JwtAuthorizationCredentials = Security(access_security),
    link_mail_address_repository: LinkMailAddressRepository = Depends(),
) -> List[GoogleOAuthCredentials]:
    username = jwt_credentials.subject.get("username")
    oauth_tokens = await link_mail_address_repository.get_all_oauth_tokens(username)
    return [GoogleOAuthCredentials(**token) for token in oauth_tokens]


async def get_google_api_clients(
    google_oauth_credentials: List[GoogleOAuthCredentials] = Depends(_get_all_google_oauth_credentials),
) -> List[GoogleApiClient]:
    return [GoogleApiClient(credentials) for credentials in google_oauth_credentials]
