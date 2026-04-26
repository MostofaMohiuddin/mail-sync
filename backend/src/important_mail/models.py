from enum import Enum
from typing import Annotated, Optional
from bson import ObjectId
from pydantic import BaseModel

from backend.src.common.models import ObjectIdPydanticAnnotation
from backend.src.google.models import EmailMetadata


class NotificationStatus(str, Enum):
    READ = "read"
    UNREAD = "unread"
    DELETED = "deleted"


class ImportantMailNotification(BaseModel):
    id: Optional[Annotated[ObjectId, ObjectIdPydanticAnnotation]] = None
    linked_mail_address_id: Annotated[ObjectId, ObjectIdPydanticAnnotation]
    mail_metadata: EmailMetadata
    status: NotificationStatus = NotificationStatus.UNREAD


class ImportantMailClassification(BaseModel):
    mail_id: str
    is_important: bool
    reason: Optional[str] = None
    classified_at: str
