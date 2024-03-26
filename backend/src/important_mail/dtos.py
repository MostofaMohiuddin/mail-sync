from pydantic import BaseModel

from backend.src.important_mail.models import ImportantMailNotification


class ImportantMailDetectRequest(BaseModel):
    subject: str
    sender: str
    snippet: str


class ImportantMailNotificationRequest(BaseModel):
    notifications: list[ImportantMailNotification]
