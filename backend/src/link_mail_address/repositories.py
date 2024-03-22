from typing import Annotated

from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError

from src.common.base_repository import BaseRepository
from src.common.database.connection import get_db_session
from src.common.exceptions.http import ConflictException

from .models import LinkMailAddress, OauthTokenResponse


class LinkMailAddressRepository(BaseRepository):
    def __init__(self, db: Annotated[AsyncIOMotorDatabase, Depends(get_db_session)]):
        super().__init__(db)
        self.collection = self.db["link_mail_address"]

    async def create_indexes(self):
        """
        Create indexes for the collection.
        """
        await self.collection.create_index([("username", 1), ("email", 1)], unique=True)

    async def save_credentials(self, data: LinkMailAddress):
        try:
            await self.create_indexes()
            return await self.insert(
                self.collection,
                data,
            )
        except DuplicateKeyError as exc:
            raise ConflictException(detail="Email already exists for the user") from exc

    async def get_oauth_token_by_email(self, username: str, email: str) -> dict:
        data = await self.query(self.collection, {"username": username, "email": email.lower()})
        return data.get("oauth_tokens", None)

    async def get_by_email(self, username: str, email: str) -> dict:
        return await self.query(self.collection, {"username": username, "email": email.lower()})

    async def get_all_oauth_tokens(self, username: str) -> list[OauthTokenResponse]:
        documents = await self.query_all(self.collection, {"username": username})
        return [OauthTokenResponse(oauth_tokens=doc["oauth_tokens"], email=doc["email"]) for doc in documents]

    async def get_all_linked_mail_address(self, username: str):
        documents = await self.query_all(self.collection, {"username": username})
        return [doc for doc in documents]

    async def unlink_mail_address(self, username: str, email: str):
        await self.delete(self.collection, {"username": username, "email": email.lower()})
