from fastapi import APIRouter, Depends, Security, status
from fastapi_jwt import JwtAuthorizationCredentials

from src.authentication.service import access_security
from src.user.models import UserResponse, UserUpdate

from .service import UserService

router = APIRouter(
    prefix="/api/user",
    tags=["User"],
)


@router.get("/", status_code=status.HTTP_200_OK)
async def get_user(
    user_service: UserService = Depends(),
    credentials: JwtAuthorizationCredentials = Security(access_security),
) -> UserResponse:
    return await user_service.get_user(credentials.subject.get("username"))


@router.put("/", status_code=status.HTTP_200_OK)
async def update_user(
    user: UserUpdate,
    user_service: UserService = Depends(),
    credentials: JwtAuthorizationCredentials = Security(access_security),
) -> UserResponse:
    return await user_service.update_user(credentials.subject.get("username"), user)
