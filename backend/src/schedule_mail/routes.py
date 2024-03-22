from fastapi import APIRouter, Depends, Security, status

from fastapi_jwt import JwtAuthorizationCredentials

from .models import ScheduleMailRequestBody, SendScheduledMailRequestBody
from .service import ScheduleMailService
from src.authentication.service import ApiKeyBasedAuthentication, access_security

router = APIRouter(
    prefix="/api/schedule-mail",
    tags=["Schedule Mail"],
)


@router.post("/", status_code=status.HTTP_201_CREATED)
async def schedule_mail(
    request_body: ScheduleMailRequestBody,
    schedule_mail_service: ScheduleMailService = Depends(),
    jwt_credentials: JwtAuthorizationCredentials = Security(access_security),
) -> None:
    await schedule_mail_service.schedule_mail(jwt_credentials.subject.get("username"), request_body)


@router.post("/send", status_code=status.HTTP_200_OK)
async def send_scheduled_mails(
    request_body: SendScheduledMailRequestBody,
    schedule_mail_service: ScheduleMailService = Depends(),
    _=Depends(ApiKeyBasedAuthentication()),
) -> None:
    await schedule_mail_service.send_scheduled_mails(request_body.schedule_mail_ids)
