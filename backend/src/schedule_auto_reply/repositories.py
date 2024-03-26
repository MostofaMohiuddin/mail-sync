from typing import Annotated, List
from bson import ObjectId
from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from backend.src.common.database.connection import get_db_session
from backend.src.common.base_repository import BaseRepository
from backend.src.common.models import ObjectIdPydanticAnnotation
from backend.src.schedule_auto_reply.models import (
    ScheduleAutoReply,
    ScheduleAutoReplyUpdateRequestBody,
    ScheduleAutoReplyResponse,
)
from backend.src.schedule_mail.models import SenderDetails


class ScheduleAutoReplyRepository(BaseRepository):
    def __init__(self, db: Annotated[AsyncIOMotorDatabase, Depends(get_db_session)]):  # type: ignore
        super().__init__(db)
        self.collection = self.db["schedule_auto_reply"]

    async def get_scheduled_auto_replies(
        self, linked_mail_address_ids: List[Annotated[ObjectId, ObjectIdPydanticAnnotation]]
    ) -> list[ScheduleAutoReplyResponse]:
        # res = await self.query(self.collection, {"linked_mail_address_id": {"$in": linked_mail_address_ids}})
        # print(res)
        condition = {"linked_mail_address_id": {"$in": linked_mail_address_ids}}
        res = await self.aggregate(
            collection=self.collection,
            pipeline=[
                {
                    "$lookup": {
                        "from": "link_mail_address",
                        "localField": "linked_mail_address_id",
                        "foreignField": "_id",
                        "as": "sender_details",
                    }
                },
                {
                    "$project": {
                        "id": "$_id",
                        "linked_mail_address_id": 1,
                        "start_time": 1,
                        "end_time": 1,
                        "subject": 1,
                        "body": 1,
                        "enabled": 1,
                        "last_mail_id": 1,
                        "last_mail_history_id": 1,
                        "sender_link_mail_address_id": 1,
                        "sender_details.username": 1,
                        "sender_details.email": 1,
                    }
                },
                {"$unwind": {"path": "$sender_details"}},
                {"$match": condition},
            ],
        )
        return [
            ScheduleAutoReplyResponse(
                **{
                    **doc,
                    "sender_details": SenderDetails(
                        username=doc.get("sender_details").get("username"), email=doc.get("sender_details").get("email")
                    ),
                }
            )
            for doc in res
        ]

    async def add_schedule_auto_reply(self, data: ScheduleAutoReply):
        return await self.insert(self.collection, data)

    async def update_schedule_auto_reply(
        self, _id: Annotated[ObjectId, ObjectIdPydanticAnnotation], data: ScheduleAutoReplyUpdateRequestBody
    ):
        return await self.update(self.collection, {"_id": _id}, data.model_dump(exclude_none=True))

    async def delete_schedule_auto_reply(self, _id: Annotated[ObjectId, ObjectIdPydanticAnnotation]) -> None:
        await self.delete(self.collection, {"_id": _id})
