from typing import Any

from fastapi import APIRouter, Depends, status, Security
from fastapi_jwt import JwtAuthorizationCredentials

from src.authentication.service import access_security

from .models import MailRequestBody, ProcessMailWithAIRequestBody
from .service import MailSyncService

router = APIRouter(
    prefix="/api/mails",
    tags=["Mail Sync"],
)


@router.get("/", status_code=status.HTTP_200_OK)
async def get_mails(
    next_page_tokens: str = None,
    mail_sync_service: MailSyncService = Depends(),
    jwt_credentials: JwtAuthorizationCredentials = Security(access_security),
) -> Any:
    return await mail_sync_service.get_mails(jwt_credentials.subject.get("username"), next_page_tokens)


@router.get("/{mail_address}/{mail_id}", status_code=status.HTTP_200_OK)
async def get_mail(
    mail_id: str,
    mail_address: str,
    mail_sync_service: MailSyncService = Depends(),
    jwt_credentials: JwtAuthorizationCredentials = Security(access_security),
) -> Any:
    return await mail_sync_service.get_mail(jwt_credentials.subject.get("username"), mail_id, mail_address)


@router.post("/", status_code=status.HTTP_200_OK)
async def send_mail(
    message: MailRequestBody,
    mail_sync_service: MailSyncService = Depends(),
    jwt_credentials: JwtAuthorizationCredentials = Security(access_security),
) -> dict:
    return await mail_sync_service.send_mail(jwt_credentials.subject.get("username"), message)


@router.post("/process-with-ai", status_code=status.HTTP_200_OK)
async def process_mail_with_ai(
    request_body: ProcessMailWithAIRequestBody,
    mail_sync_service: MailSyncService = Depends(),
    _: JwtAuthorizationCredentials = Security(access_security),
) -> dict:
    return await mail_sync_service.process_mail_with_ai(request_body)
