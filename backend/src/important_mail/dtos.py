from typing import Optional

from pydantic import BaseModel

from backend.src.google.models import UserInfo
from backend.src.important_mail.models import ImportantMailNotification


class ImportantMailDetectRequest(BaseModel):
    subject: str
    sender: str
    snippet: str


class ImportantMailNotificationRequest(BaseModel):
    notifications: list[ImportantMailNotification]


class MailMetaDataInput(BaseModel):
    """
    Mirrors the Go worker's MailMetaData JSON shape.
    """

    id: str
    history_id: str
    subject: str
    snippet: str
    sender: UserInfo
    receiver: UserInfo
    date: str


class ClassifyBatchRequest(BaseModel):
    mails: list[MailMetaDataInput]


class ClassifyBatchResultRow(BaseModel):
    mail_id: str
    is_important: bool
    reason: Optional[str] = None


class ClassifyBatchResponse(BaseModel):
    results: list[ClassifyBatchResultRow]
