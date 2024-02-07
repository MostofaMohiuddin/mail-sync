from typing import Any
from fastapi import APIRouter, Depends, Security, status
from fastapi_jwt import JwtAuthorizationCredentials

from src.authentication.service import access_security
from .service import MailSyncService

router = APIRouter(
    prefix="/api/mails",
    tags=["Mail Sync"],
)


@router.get("/", status_code=status.HTTP_200_OK)
async def get_mails(
    mail_sync_service: MailSyncService = Depends(),
    _: JwtAuthorizationCredentials = Security(access_security),
) -> Any:
    return await mail_sync_service.get_mails()
