from typing import Annotated, Any

from bson import ObjectId
from fastapi import APIRouter, Depends, status, Security
from fastapi_jwt import JwtAuthorizationCredentials

from backend.src.authentication.service import access_security
from backend.src.common.models import ObjectIdPydanticAnnotation
from backend.src.schedule_auto_reply.models import ScheduleAutoReplyRequestBody, ScheduleAutoReplyUpdateRequestBody
from backend.src.schedule_auto_reply.service import ScheduleAutoReplyService


router = APIRouter(
    prefix="/api/schedule-auto-reply",
    tags=["Schedule Auto Reply"],
)


@router.post("/", status_code=status.HTTP_200_OK)
async def schedule_auto_reply(
    request_body: ScheduleAutoReplyRequestBody,
    schedule_auto_reply_service: ScheduleAutoReplyService = Depends(),
    jwt_credentials: JwtAuthorizationCredentials = Security(access_security),
) -> Any:
    return await schedule_auto_reply_service.schedule_auto_reply(jwt_credentials.subject.get("username"), request_body)


@router.put("/{schedule_auto_reply_id}", status_code=status.HTTP_200_OK)
async def update_schedule_mail(
    schedule_auto_reply_id: Annotated[ObjectId, ObjectIdPydanticAnnotation],
    request_body: ScheduleAutoReplyUpdateRequestBody,
    schedule_auto_reply_service: ScheduleAutoReplyService = Depends(),
) -> None:
    await schedule_auto_reply_service.update_schedule_auto_reply(schedule_auto_reply_id, request_body)
