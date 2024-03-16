from enum import Enum
from typing import Optional

from pydantic import BaseModel, model_serializer


class CalendarEvent(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    created: str
    updated: str
    start: str
    end: str
    location: Optional[str] = None
    attendees: Optional[list[str]] = None
    creator_email: str
    video_conference_link: Optional[str] = None


class CalendarEventResponse(BaseModel):
    events: list[CalendarEvent]
    email: str
