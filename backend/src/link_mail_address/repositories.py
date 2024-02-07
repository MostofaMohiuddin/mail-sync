from typing import Annotated

from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError

from src.common.base_repository import BaseRepository
from src.common.database.connection import get_db_session
from src.common.exceptions.http import ConflictException

from .models import LinkMailAddress


class LinkMailAddressRepository(BaseRepository):
    def __init__(self, db: Annotated[AsyncIOMotorDatabase, Depends(get_db_session)]):
        super().__init__(db)
        self.collection = self.db["link_mail_address"]

    async def create_indexes(self):
        """
        Create indexes for the collection.
        """
        await self.collection.create_index([("username", 1), ("email", 1)], unique=True)

    async def save_tokens(self, data: LinkMailAddress):
        try:
            await self.create_indexes()
            return await self.insert(
                self.collection,
                data,
            )
        except DuplicateKeyError as exc:
            raise ConflictException(detail="Email already exists for the user") from exc

    async def get_tokens(self, username: str, email: str):
        data = await self.query(self.collection, {"username": username, "email": email})
        return data.get("credentials")
