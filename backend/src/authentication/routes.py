from fastapi import APIRouter, Depends, Security, status
from fastapi_jwt import JwtAuthorizationCredentials

from src.user.models import User, UserResponse
from src.user.service import UserService

from .models import Token
from .service import PasswordBasedAuthentication, refresh_security

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


@router.post("/sign-up", status_code=status.HTTP_201_CREATED)
async def sign_up(
    user: User,
    user_service: UserService = Depends(),
) -> UserResponse:
    """
    Register a new user.

    Parameters:
    - user (User): The user data for registration.
    - user_service (UserService, optional): The user service dependency for handling user-related operations.

    Returns:
    UserResponse: A response containing details about the registered user.
    """
    return await user_service.create_user(user)


@router.post("/sign-in", status_code=status.HTTP_200_OK)
async def sign_in(
    user: User,
    user_service: UserService = Depends(),
) -> Token:
    """
    Authenticate and sign in a user.

    Parameters:
    - user (User): The user data for authentication.
    - user_service (UserService, optional): The user service dependency for handling user-related operations.

    Returns:
    Token: A response containing the JWT token pair.
    """
    return await user_service.sign_in(user)


@router.get("/refresh-token", status_code=status.HTTP_200_OK)
async def refresh_jwt_token(
    credentials: JwtAuthorizationCredentials = Security(refresh_security),
    auth: PasswordBasedAuthentication = Depends(),
) -> Token:
    """
    Refresh the access token using a valid refresh token.

    Parameters:
    - credentials (JwtAuthorizationCredentials): The JWT authorization credentials containing the refresh token.
    - auth (PasswordBasedAuthentication, optional): The authentication dependency for handling token refresh.

    Returns:
    Token: A response containing the new access token.
    """
    return auth.refresh_jwt_token(credentials)
