from typing import Annotated, Any

from bson import ObjectId
from fastapi import APIRouter, Depends, status, Security
from fastapi_jwt import JwtAuthorizationCredentials

from backend.src.authentication.service import access_security

from backend.src.common.models import ObjectIdPydanticAnnotation
from backend.src.mails.models import MailRequestBody, ProcessMailWithAIRequestBody
from backend.src.mails.service import MailSyncService

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


@router.get("/link-mail-address/{link_mail_address_id}/mails/{mail_id}", status_code=status.HTTP_200_OK)
async def get_mail_by_link_address_id(
    mail_id: str,
    link_mail_address_id: Annotated[ObjectId, ObjectIdPydanticAnnotation],
    mail_format: str = "full",
    mail_sync_service: MailSyncService = Depends(),
) -> Any:
    return await mail_sync_service.get_mail_by_link_address_id(link_mail_address_id, mail_id, mail_format)


@router.get("/link-mail-address/{link_mail_address_id}/history/{mail_history_id}", status_code=status.HTTP_200_OK)
async def get_mail_history(
    mail_history_id: str,
    link_mail_address_id: Annotated[ObjectId, ObjectIdPydanticAnnotation],
    next_page_token: str = None,
    mail_sync_service: MailSyncService = Depends(),
) -> Any:
    return await mail_sync_service.get_mail_history(link_mail_address_id, mail_history_id, next_page_token)


@router.get("/link-mail-address/{link_mail_address_id}/mails", status_code=status.HTTP_200_OK)
async def get_mails_by_link_address_id(
    link_mail_address_id: Annotated[ObjectId, ObjectIdPydanticAnnotation],
    next_page_token: str = None,
    number_of_mails: int = 10,
    mail_sync_service: MailSyncService = Depends(),
) -> Any:
    return await mail_sync_service.get_mails_by_link_address_id(link_mail_address_id, next_page_token, number_of_mails)


@router.post("/link-mail-address/{link_mail_address_id}/send", status_code=status.HTTP_200_OK)
async def send_mail_by_link_mail_address_id(
    link_mail_address_id: Annotated[ObjectId, ObjectIdPydanticAnnotation],
    message: MailRequestBody,
    mail_sync_service: MailSyncService = Depends(),
) -> dict:
    return await mail_sync_service.send_mail_by_link_address_id(link_mail_address_id, message)
