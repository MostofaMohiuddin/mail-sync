import time
from typing import Any

from fastapi import Depends, Security
from fastapi_jwt import JwtAuthorizationCredentials

from src.google.google_api_client import GoogleApiClient
from src.authentication.service import access_security
from src.google.models import GoogleOAuthCredentials
from src.link_mail_address.service import LinkMailAddressService


from dateutil.parser import parse

from .dtos import CalendarEventResponse, CalendarEvent


class CalendarSyncService:
    def __init__(
        self,
        link_mail_address_service: LinkMailAddressService = Depends(),
        jwt_credentials: JwtAuthorizationCredentials = Security(access_security),
    ):
        self.link_mail_address_service = link_mail_address_service
        self.username = jwt_credentials.subject.get("username")

    async def get_events(self, time_min=None, time_max=None) -> list[CalendarEventResponse]:
        oauth_tokens = await self.link_mail_address_service.get_all_oauth_tokens(self.username)
        google_api_clients = [
            GoogleApiClient(
                GoogleOAuthCredentials(**token.oauth_tokens),
                token.email,
            )
            for token in oauth_tokens
        ]
        data = []
        for client in google_api_clients:
            calendar_events_response = client.get_user_calendar_events(time_min=time_min, time_max=time_max)
            events = [
                CalendarEvent(
                    **{
                        **event,
                        "title": event.get("summary"),
                        "creator_email": event.get("creator", {}).get("email"),
                        "start": event.get("start", {}).get("dateTime"),
                        "end": event.get("end", {}).get("dateTime"),
                        "attendees": [attendee.get("email") for attendee in event.get("attendees", [])],
                        "video_conference_link": event.get("hangoutLink"),
                    }
                )
                for event in calendar_events_response.get("events", [])
            ]
            data.append(CalendarEventResponse(events=events, email=calendar_events_response.get("email")))

        print(data)
        return data
