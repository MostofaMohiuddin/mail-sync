from typing import Annotated

from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError

from src.common.base_repository import BaseRepository
from src.common.database.connection import get_db_session
from src.common.exceptions.http import ConflictException, NotFoundException

from .models import User, UserUpdate


class UserRepository(BaseRepository):
    """
    Repository class for user-related database operations.

    Args:
    - db (AsyncIOMotorDatabase): The MongoDB database instance.

    Attributes:
    - collection: The MongoDB collection for user data.

    Methods:
    - create_indexes: Create indexes, including a unique index on the "username" field. This method should be executed initially and only once.
    - create_user(user: User): Create a new user in the database.
    - get_user_by_username(username: str) -> User: Retrieve a user by their username.
    """

    def __init__(self, db: Annotated[AsyncIOMotorDatabase, Depends(get_db_session)]):
        super().__init__(db)
        self.collection = self.db["users"]

    async def create_indexes(self):
        """
        Create indexes, including a unique index on the "username" field.
        This method should be executed initially and only once.
        """
        await self.collection.create_index("username", unique=True)

    async def create_user(self, user: User):
        """
        Create a new user in the database.

        Args:
        - user (User): The user data to be inserted.

        Raises:
        - ConflictException: If a user with the same username already exists.

        Returns:
        dict: The inserted user data.
        """
        try:
            await self.create_indexes()
            return await self.insert(
                self.collection,
                user,
            )
        except DuplicateKeyError as exc:
            raise ConflictException(detail="Username already exists") from exc

    async def get_user_by_username(self, username: str) -> User:
        """
        Retrieve a user by their username.

        Args:
        - username (str): The username of the user to retrieve.

        Returns:
        User: The user data.
        """
        user_data = await self.query(self.collection, {"username": username})
        if not user_data:
            raise NotFoundException(detail="User not found")
        return User(**user_data)

    async def update_user(self, username: str, user: UserUpdate):
        """
        Update a user in the database.

        Args:
        - username (str): The username of the user to be updated.
        - user (UserUpdate): The user data to be updated.

        Returns:
        dict: The updated user data.
        """
        return await self.update(
            self.collection,
            {"username": username},
            user.dict(exclude_unset=True),
        )
