from typing import Annotated
from fastapi import APIRouter, Depends, Security, status

from fastapi_jwt import JwtAuthorizationCredentials
from bson import ObjectId

from src.common.models import ObjectIdPydanticAnnotation
from src.schedule_mail.models import (
    ScheduleMailRequestBody,
    SendScheduledMailRequestBody,
    ScheduleMailWithSenderDetails,
)
from src.schedule_mail.service import ScheduleMailService
from src.authentication.service import ApiKeyBasedAuthentication, access_security

router = APIRouter(
    prefix="/api/schedule-mail",
    tags=["Schedule Mail"],
)


@router.get("/", status_code=status.HTTP_200_OK)
async def get_scheduled_mails(
    schedule_mail_service: ScheduleMailService = Depends(),
    jwt_credentials: JwtAuthorizationCredentials = Security(access_security),
) -> list[ScheduleMailWithSenderDetails]:
    return await schedule_mail_service.get_scheduled_mails(jwt_credentials.subject.get("username"))


@router.post("/", status_code=status.HTTP_201_CREATED)
async def schedule_mail(
    request_body: ScheduleMailRequestBody,
    schedule_mail_service: ScheduleMailService = Depends(),
    jwt_credentials: JwtAuthorizationCredentials = Security(access_security),
) -> None:
    await schedule_mail_service.schedule_mail(jwt_credentials.subject.get("username"), request_body)


@router.put("/{schedule_mail_id}", status_code=status.HTTP_200_OK)
async def update_schedule_mail(
    schedule_mail_id: Annotated[ObjectId, ObjectIdPydanticAnnotation],
    request_body: ScheduleMailRequestBody,
    schedule_mail_service: ScheduleMailService = Depends(),
    # _: JwtAuthorizationCredentials = Security(access_security),
) -> None:
    await schedule_mail_service.update_schedule_mail(schedule_mail_id, request_body)


@router.post("/send", status_code=status.HTTP_200_OK)
async def send_scheduled_mails(
    request_body: SendScheduledMailRequestBody,
    schedule_mail_service: ScheduleMailService = Depends(),
    _=Depends(ApiKeyBasedAuthentication()),
) -> None:
    await schedule_mail_service.send_scheduled_mails(request_body.schedule_mail_ids)
