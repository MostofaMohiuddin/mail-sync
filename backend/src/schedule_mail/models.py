from datetime import datetime
from enum import Enum
from typing import Annotated

from bson import ObjectId
from pydantic import BaseModel

from src.common.models import ObjectIdPydanticAnnotation
from src.mails.models import MailBody


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
    scheduled_at: str


class SendScheduledMailRequestBody(BaseModel):
    schedule_mail_ids: list[Annotated[ObjectId, ObjectIdPydanticAnnotation]]


class SenderDetails(BaseModel):
    username: str
    email: str


class ScheduleMailWithSenderDetails(ScheduleMail):
    id: Annotated[ObjectId, ObjectIdPydanticAnnotation]
    sender_details: SenderDetails
