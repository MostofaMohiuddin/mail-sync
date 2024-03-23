from typing import Annotated
from bson import ObjectId
from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from backend.src.common.database.connection import get_db_session
from backend.src.common.base_repository import BaseRepository
from backend.src.common.models import ObjectIdPydanticAnnotation
from backend.src.schedule_auto_reply.models import ScheduleAutoReply, ScheduleAutoReplyUpdateRequestBody


class ScheduleAutoReplyRepository(BaseRepository):
    def __init__(self, db: Annotated[AsyncIOMotorDatabase, Depends(get_db_session)]):  # type: ignore
        super().__init__(db)
        self.collection = self.db["schedule_auto_reply"]

    async def add_schedule_auto_reply(self, data: ScheduleAutoReply):
        return await self.insert(self.collection, data)

    async def update_schedule_auto_reply(
        self, _id: Annotated[ObjectId, ObjectIdPydanticAnnotation], data: ScheduleAutoReplyUpdateRequestBody
    ):
        return await self.update(self.collection, {"_id": _id}, data.model_dump(exclude_none=True))
