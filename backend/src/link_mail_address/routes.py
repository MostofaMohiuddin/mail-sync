from fastapi import APIRouter, Depends, Security, status
from fastapi_jwt import JwtAuthorizationCredentials

from src.authentication.service import access_security

from .models import EmailType, LinkMailAddressResponse, LinkMailRequest, RedirectLinkResponse
from .service import LinkMailAddressService

router = APIRouter(
    prefix="/api/link-mail-address",
    tags=["Link Mail Address"],
)


@router.get("/oauth-url", status_code=status.HTTP_200_OK)
def get_oauth_url(
    email_type: EmailType,
    link_mail_address_service: LinkMailAddressService = Depends(),
    _: JwtAuthorizationCredentials = Security(access_security),
) -> RedirectLinkResponse:
    return link_mail_address_service.create_oauth_url(email_type)


@router.post("/", status_code=status.HTTP_200_OK)
async def link_mail_address(
    request_body: LinkMailRequest,
    link_mail_address_service: LinkMailAddressService = Depends(),
    credentials: JwtAuthorizationCredentials = Security(access_security),
) -> dict:
    return await link_mail_address_service.save_oauth_tokens(credentials.subject.get("username"), request_body)


@router.get("/", status_code=status.HTTP_200_OK)
async def get_linked_mail_address(
    link_mail_address_service: LinkMailAddressService = Depends(),
    credentials: JwtAuthorizationCredentials = Security(access_security),
) -> list[LinkMailAddressResponse]:
    return await link_mail_address_service.get_all_linked_mail_address(credentials.subject.get("username"))


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
async def unlink_mail_address(
    email: str,
    link_mail_address_service: LinkMailAddressService = Depends(),
    credentials: JwtAuthorizationCredentials = Security(access_security),
) -> None:
    print(email)
    await link_mail_address_service.unlink_mail_address(credentials.subject.get("username"), email)
