from datetime import datetime
from typing import Annotated, Any, Optional
from dateutil.parser import parse

from bson import ObjectId
from pydantic import BaseModel, model_validator

from src.common.fastapi_http_exceptions import BadRequestException
from src.common.models import ObjectIdPydanticAnnotation
from src.mails.models import MailBody
from src.schedule_mail.models import SenderDetails


class ScheduleAutoReply(BaseModel):
    linked_mail_address_id: Annotated[ObjectId, ObjectIdPydanticAnnotation]
    start_time: datetime
    end_time: datetime
    subject: Optional[str] = None
    body: MailBody
    last_mail_history_id: Optional[str] = None
    last_mail_id: Optional[str] = None
    enabled: Optional[bool] = True
    note: Optional[str] = None


class ScheduleAutoReplyRequestBody(BaseModel):
    mail_addresses: list[str]
    start_time: datetime
    end_time: datetime
    subject: Optional[str] = None
    body: MailBody

    @model_validator(mode="before")
    @classmethod
    def validate_start_and_end_time(cls, data: Any) -> Any:
        now = datetime.now()
        assert isinstance(data, dict)

        if parse(data.get("start_time"), ignoretz=True) < now:
            raise BadRequestException(detail="Start time should be greater than current time")
        if parse(data.get("start_time")) > parse(data.get("end_time")):
            raise BadRequestException(detail="End time should be greater than start time")
        return data


class ScheduleAutoReplyUpdateRequestBody(BaseModel):
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    subject: Optional[str] = None
    body: Optional[MailBody] = None
    last_mail_history_id: Optional[str] = None
    last_mail_id: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def validate_start_and_end_time(cls, data: Any) -> Any:
        now = datetime.now()
        assert isinstance(data, dict)
        if data.get("start_time") and parse(data.get("start_time"), ignoretz=True) < now:
            raise BadRequestException(detail="Start time should be greater than current time")
        if (
            data.get("start_time")
            and data.get("end_time")
            and parse(data.get("start_time")) > parse(data.get("end_time"))
        ):
            raise BadRequestException(detail="End time should be greater than start time")
        return data


class ScheduleAutoReplyResponse(ScheduleAutoReply):
    id: Annotated[ObjectId, ObjectIdPydanticAnnotation]
    sender_details: SenderDetails
