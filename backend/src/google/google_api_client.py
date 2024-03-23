import base64
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import google_auth_httplib2
import httplib2
from googleapiclient.discovery import build as googleapiclient_builder

import google.oauth2.credentials
from backend.src.common.exceptions.http import RequestTimeoutException
from backend.src.logger.default_logger import LOGGER
from backend.src.mails.models import MailRequestBody

from .models import EmailBody, EmailFullData, GoogleOAuthCredentials, UserInfo, EmailMetadata, GmailMetadataList

import re


class GoogleApiClient:
    def __init__(self, credentials: GoogleOAuthCredentials, gmail: str):
        self.google_oauth_credentials = google.oauth2.credentials.Credentials(**credentials.dict())
        self.gmail = gmail

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
        return UserInfo(**user)

    def _extract_email_and_name(self, sample: str) -> UserInfo:
        # Extracting name and email using regular expressions
        match = re.match(r"(.*)<([^<>]+)>", sample)
        if match:
            name = match.group(1).strip()
            email = match.group(2)
        else:
            # If no name is provided, extract email only
            name = None
            match = re.match(r"[^<>]+<([^<>]+)>", sample)
            if match:
                email = match.group(1)
            else:
                # If no angle brackets are provided, consider the entire string as email
                email = sample.strip()
        return UserInfo(
            email=email,
            name=name,
        )

    def get_user_mails(self, next_page_token=None, number_of_mails: int = 10) -> GmailMetadataList:
        service = googleapiclient_builder("gmail", "v1", credentials=self.google_oauth_credentials)
        # next_page_token is "null" when there are no more emails to fetch
        if next_page_token == "null":
            return GmailMetadataList(emails=[], next_page_token=None, receiver=self.gmail)
        response = (
            service.users()
            .messages()
            .list(
                userId="me",
                maxResults=number_of_mails,
                labelIds="UNREAD",
                includeSpamTrash=False,
                pageToken=next_page_token,
            )
            .execute()
        )
        nextPageToken = response.get("nextPageToken", None)
        message_list = response.get("messages", [])
        services = [
            service.users().messages().get(userId="me", id=message["id"], format="metadata") for message in message_list
        ]
        batch = service.new_batch_http_request()
        message_list_with_metadata = self._batch_request(batch, services)
        email_metadata_list = []
        for message in message_list_with_metadata:
            headers = {header["name"]: header["value"] for header in message["payload"]["headers"]}
            if all(label not in message.get("labelIds", []) for label in ["SENT", "DRAFT"]):
                email_metadata_list.append(
                    EmailMetadata(
                        sender=self._extract_email_and_name(
                            headers.get("From", ""),
                        ),
                        receiver=self._extract_email_and_name(
                            headers.get("To", ""),
                        ),
                        subject=headers.get("Subject", ""),
                        date=headers.get("Date", ""),
                        snippet=message["snippet"],
                        id=message["id"],
                        history_id=message["historyId"],
                    )
                )
        return GmailMetadataList(emails=email_metadata_list, next_page_token=nextPageToken, receiver=self.gmail)

    def get_user_mail(self, mail_id: str, mail_format: str = "full") -> EmailMetadata:
        service = googleapiclient_builder("gmail", "v1", credentials=self.google_oauth_credentials)
        message = service.users().messages().get(userId="me", id=mail_id, format=mail_format).execute()
        headers = {header["name"]: header["value"] for header in message["payload"]["headers"]}
        if mail_format == "metadata":
            return EmailMetadata(
                sender=self._extract_email_and_name(
                    headers.get("From", ""),
                ),
                receiver=self._extract_email_and_name(
                    headers.get("To", ""),
                ),
                subject=headers.get("Subject", ""),
                date=headers.get("Date", ""),
                snippet=message["snippet"],
                id=message["id"],
                history_id=message["historyId"],
            )
        html, plain = None, None
        if "multipart" in message["payload"]["mimeType"]:
            for part in message["payload"]["parts"]:
                if part["mimeType"] == "text/html":
                    html = base64.urlsafe_b64decode(part["body"]["data"]).decode()
                elif part["mimeType"] == "text/plain":
                    plain = base64.urlsafe_b64decode(part["body"]["data"]).decode()
        elif message["payload"]["mimeType"] == "text/html":
            html = base64.urlsafe_b64decode(message["payload"]["body"]["data"]).decode()
            plain = None
        elif message["payload"]["mimeType"] == "text/plain":
            plain = base64.urlsafe_b64decode(message["payload"]["body"]["data"]).decode()
            html = plain

        return EmailFullData(
            sender=self._extract_email_and_name(
                headers.get("From", ""),
            ),
            receiver=self._extract_email_and_name(
                headers.get("To", ""),
            ),
            subject=headers.get("Subject", ""),
            date=headers.get("Date", ""),
            snippet=message["snippet"],
            id=message["id"],
            body=EmailBody(
                html=html,
                plain=plain,
            ),
            history_id=message["historyId"],
        )

    def get_user_mail_history(self, mail_history_id: str, next_page_token: str = None) -> dict:
        service = googleapiclient_builder("gmail", "v1", credentials=self.google_oauth_credentials)
        history = (
            service.users()
            .history()
            .list(
                userId="me",
                startHistoryId=mail_history_id,
                historyTypes="messageAdded",
                labelId="UNREAD",
                maxResults=1,
                pageToken=next_page_token,
            )
            .execute()
        )
        return history

    def _create_encoded_message(self, email_subject, email_to, email_from, message_body, html_content=None):
        message = MIMEMultipart("alternative")
        message["to"] = email_to
        message["from"] = email_from
        message["subject"] = email_subject
        # message["Cc"] = email_cc
        body_mime = MIMEText(message_body, "plain")
        message.attach(body_mime)
        if html_content:
            html_mime = MIMEText(html_content, "html")
            message.attach(html_mime)
        return {"raw": base64.urlsafe_b64encode(bytes(message.as_string(), "utf-8")).decode("utf-8")}

    def send_mail(self, mail_request_body: MailRequestBody):
        service = googleapiclient_builder("gmail", "v1", credentials=self.google_oauth_credentials)
        # email = EmailMessage()
        # email["to"] = message.receiver
        # email["from"] = message.sender
        # email["subject"] = message.subject
        # # email["content-type"] = "text/html"
        # email.set_content(message.message)
        # # encoded message
        # encoded_message = base64.urlsafe_b64encode(email.as_bytes()).decode()

        create_message = {
            "raw": self._create_encoded_message(
                mail_request_body.subject,
                mail_request_body.receiver,
                mail_request_body.sender,
                mail_request_body.body.plain,
                mail_request_body.body.html,
            ).get("raw")
        }

        return service.users().messages().send(userId="me", body=create_message).execute()

    def _get_current_month_range(self) -> dict:
        # Get current date
        current_date = datetime.utcnow()

        # Get first day of the current month
        first_day_of_month = current_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # Calculate the last day of the current month
        next_month = first_day_of_month.replace(month=first_day_of_month.month + 1)
        last_day_of_month = next_month - timedelta(days=1)

        # Convert to RFC3339 timestamp with mandatory time zone offset
        start_of_month_rfc3339 = first_day_of_month.isoformat() + "Z"
        end_of_month_rfc3339 = last_day_of_month.isoformat() + "Z"

        return {"time_min": start_of_month_rfc3339, "time_max": end_of_month_rfc3339}

    def get_user_calendar_events(self, time_min=None, time_max=None):
        service = googleapiclient_builder("calendar", "v3", credentials=self.google_oauth_credentials)
        if not time_min and not time_max:
            time_range = self._get_current_month_range()
            time_min = time_range["time_min"]
            time_max = time_range["time_max"]
        print(time_min, time_max)
        events = (service.events().list(calendarId="primary", timeMax=time_max, timeMin=time_min).execute()).get(
            "items", []
        )

        return {"events": events, "email": self.gmail}
