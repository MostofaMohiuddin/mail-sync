from datetime import datetime
from dateutil.parser import parse
from enum import Enum
from typing import Annotated, Any

from bson import ObjectId
from pydantic import BaseModel, model_validator

from backend.src.common.fastapi_http_exceptions import BadRequestException
from backend.src.common.models import ObjectIdPydanticAnnotation
from backend.src.mails.models import MailBody


class ScheduleMailStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"


class ScheduleMail(BaseModel):
    sender_link_mail_address_id: Annotated[ObjectId, ObjectIdPydanticAnnotation]
    receiver: str
    subject: str
    body: MailBody
    status: ScheduleMailStatus
    scheduled_at: datetime


class ScheduleMailRequestBody(BaseModel):
    sender: str
    receiver: str
    subject: str
    body: MailBody
    scheduled_at: datetime

    @model_validator(mode="before")
    @classmethod
    def validate_scheduled_at(cls, values) -> Any:
        if parse(values.get("scheduled_at"), ignoretz=True) < datetime.now():
            raise BadRequestException(detail="Scheduled time should be in future")
        return values


class SendScheduledMailRequestBody(BaseModel):
    schedule_mail_ids: list[Annotated[ObjectId, ObjectIdPydanticAnnotation]]


class SenderDetails(BaseModel):
    username: str
    email: str


class ScheduleMailWithSenderDetails(ScheduleMail):
    id: Annotated[ObjectId, ObjectIdPydanticAnnotation]
    sender_details: SenderDetails
