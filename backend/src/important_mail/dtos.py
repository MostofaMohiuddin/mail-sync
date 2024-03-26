from pydantic import BaseModel

from backend.src.important_mail.models import ImportantMailNotification


class ImportantMailDetectRequest(BaseModel):
    subject: str
    sender: str


class ImportantMailNotificationRequest(BaseModel):
    notifications: list[ImportantMailNotification]
