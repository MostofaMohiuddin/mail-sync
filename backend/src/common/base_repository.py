from abc import ABC
from typing import Annotated

from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorCollection, AsyncIOMotorDatabase
from pydantic import BaseModel

from src.common.database.connection import get_db_session
from src.common.models import PaginationData, SortData


class BaseRepository(ABC):
    """
    This is Abstract Base Interface Repository for all the repositories.
    All the repositories must implement this class.
    """

    def __init__(self, db: Annotated[AsyncIOMotorDatabase, Depends(get_db_session)]) -> None:
        self.db = db

    async def insert(self, collection: AsyncIOMotorCollection, entity_model: BaseModel):
        inserted_entity = await collection.insert_one(entity_model.dict())
        return await self.query(collection, {"_id": inserted_entity.inserted_id})

    async def update(self, collection: AsyncIOMotorCollection, query: dict, update: dict):
        await collection.update_one(query, {"$set": update})
        return await self.query(collection, query)

    async def query(self, collection: AsyncIOMotorCollection, query: dict):
        return await collection.find_one(query)

    async def query_all(
        self,
        collection: AsyncIOMotorCollection,
        query: dict,
        sort: SortData = None,
        pagination: PaginationData = None,
    ):
        cursor = collection.find(query)
        # Modify the query before iterating
        if pagination:
            offset = (pagination.page_no - 1) * pagination.page_size
            page_size = pagination.page_size
            cursor = cursor.skip(offset).limit(page_size)
        if sort:
            cursor = cursor.sort(sort.key, sort.value)
        return [document async for document in cursor]

    async def delete(self, collection: AsyncIOMotorCollection, query: dict):
        await collection.delete_one(query)

    # def save(self) -> None:
    #     try:
    #         self.d
    #     except Exception as error:
    #         self.session.rollback()
    #         raise error

    # def refresh(self, obj: object) -> None:
    #     self.session.refresh(obj)

    # @staticmethod
    # def paginate(
    #     query: Query,
    #     page_no: int,
    #     page_size: int,
    # ) -> Pagination:
    #     return Pagination(query, page_no, page_size, should_count=True)
