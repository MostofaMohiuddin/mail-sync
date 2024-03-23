from datetime import datetime
from typing import Annotated, Any, Optional
from dateutil.parser import parse

from bson import ObjectId
from pydantic import BaseModel, model_validator

from backend.src.common.fastapi_http_exceptions import BadRequestException
from backend.src.common.models import ObjectIdPydanticAnnotation
from backend.src.mails.models import MailBody


class ScheduleAutoReply(BaseModel):
    linked_mail_address_id: Annotated[ObjectId, ObjectIdPydanticAnnotation]
    start_time: datetime
    end_time: datetime
    subject: str
    body: MailBody
    last_mail_history_id: Optional[str] = None
    last_mail_id: Optional[str] = None


class ScheduleAutoReplyRequestBody(BaseModel):
    mail_addresses: list[str]
    start_time: datetime
    end_time: datetime
    subject: str
    body: MailBody

    @model_validator(mode="before")
    @classmethod
    def validate_start_and_end_time(cls, data: Any) -> Any:
        now = datetime.now()
        assert isinstance(data, dict)
        if parse(data.get("start_time")) < now:
            raise BadRequestException(detail="Start time should be greater than current time")
        if parse(data.get("start_time")) > parse(data.get("end_time")):
            raise BadRequestException(detail="End time should be greater than start time")
        return data
