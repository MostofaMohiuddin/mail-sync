from typing import Annotated

from fastapi import Depends

from src.authentication.ingress.basic_auth.auth import PasswordBasedAuthentication
from src.authentication.ingress.basic_auth.models import Token
from src.common.exceptions.http import NotFoundException, UnauthorizedException

from .models import User, UserResponse, UserUpdate
from .repositories import UserRepository


class UserService:
    def __init__(
        self,
        user_repository: Annotated[UserRepository, Depends()],
        auth: Annotated[PasswordBasedAuthentication, Depends()],
    ):
        self.user_repository = user_repository
        self.auth = auth

    async def get_user(self, username: str) -> UserResponse:
        user = await self.user_repository.get_user_by_username(username)
        return UserResponse(**user.dict())

    async def update_user(self, username: str, user: UserUpdate) -> UserResponse:
        user_to_update = UserUpdate(
            **{
                **user.dict(),
                "password": self.auth.encrypt_password(user.password),
            }
        )
        return UserResponse(**await self.user_repository.update_user(username, user_to_update))

    async def create_user(
        self,
        user: User,
    ) -> UserResponse:
        new_user = User(
            **{
                **user.dict(),
                "password": self.auth.encrypt_password(user.password),
            }
        )
        return UserResponse(**await self.user_repository.create_user(new_user))

    async def sign_in(self, user: User) -> Token:
        try:
            user_in_db = await self.user_repository.get_user_by_username(user.username)
            is_user_verified = user_in_db and self.auth.verify_password(
                user.password,
                user_in_db.password,
            )
            if not is_user_verified:
                raise UnauthorizedException(detail="Invalid username or password")
            return self.auth.create_jwt_token(user_in_db)
        except (NotFoundException, Exception) as exc:
            raise UnauthorizedException(detail="Invalid username or password") from exc
