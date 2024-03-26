from typing import Annotated
from bson import ObjectId
from fastapi import APIRouter, Depends, Security
from fastapi_jwt import JwtAuthorizationCredentials

from backend.src.common.models import ObjectIdPydanticAnnotation
from backend.src.important_mail.dtos import ImportantMailDetectRequest, ImportantMailNotificationRequest
from backend.src.important_mail.models import ImportantMailNotification
from backend.src.important_mail.service import ImportantMailService
from backend.src.authentication.service import access_security

router = APIRouter(
    prefix="/api/important-mail",
    tags=["Important Mail"],
)


@router.post("/detect", status_code=200)
async def detect_important_mail(
    request_body: ImportantMailDetectRequest,
    import_mail_service: ImportantMailService = Depends(),
):
    return import_mail_service.detect_important(request_body.subject, request_body.sender)


@router.post("/notifications", status_code=200)
async def create_important_mail_notification(
    request_body: ImportantMailNotificationRequest,
    import_mail_service: ImportantMailService = Depends(),
):
    return await import_mail_service.create_important_mail_notification(request_body.notifications)


@router.get("/notifications", status_code=200)
async def get_important_mail_notifications(
    import_mail_service: ImportantMailService = Depends(),
    jwt_credentials: JwtAuthorizationCredentials = Security(access_security),
) -> list[ImportantMailNotification]:
    return await import_mail_service.get_important_mail_notifications(jwt_credentials.subject.get("username"))


@router.put("/notifications/read", status_code=200)
async def mark_important_mail_notification_as_read(
    notification_ids: list[Annotated[ObjectId, ObjectIdPydanticAnnotation]],
    import_mail_service: ImportantMailService = Depends(),
    _: JwtAuthorizationCredentials = Security(access_security),
) -> None:
    await import_mail_service.mark_important_mail_notification_as_read(notification_ids)
