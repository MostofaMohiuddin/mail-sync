from typing import Annotated

from bson import ObjectId
from pydantic import BaseModel

from src.common.models import ObjectIdPydanticAnnotation


class MailHistory(BaseModel):
    linked_mail_address_id: Annotated[ObjectId, ObjectIdPydanticAnnotation]
    mail_history_id: str
