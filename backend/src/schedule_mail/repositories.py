from typing import Annotated


from bson import ObjectId
from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from backend.src.common.models import ObjectIdPydanticAnnotation
from backend.src.common.base_repository import BaseRepository
from backend.src.common.database.connection import get_db_session

from backend.src.schedule_mail.models import (
    ScheduleMail,
    ScheduleMailStatus,
    ScheduleMailWithSenderDetails,
    SenderDetails,
)


class ScheduleMailRepository(BaseRepository):
    def __init__(self, db: Annotated[AsyncIOMotorDatabase, Depends(get_db_session)]):
        super().__init__(db)
        self.collection = self.db["scheduled_mail"]

    async def schedule_mail(self, data: ScheduleMail):
        return await self.insert(
            self.collection,
            data,
        )

    async def update_status(self, id: Annotated[ObjectId, ObjectIdPydanticAnnotation], status: ScheduleMailStatus):
        return await self.update(
            self.collection,
            {"_id": id},
            {"status": status.value},
        )

    async def get_scheduled_mails_by_user(
        self, linked_mail_address_ids: list[Annotated[ObjectId, ObjectIdPydanticAnnotation]]
    ) -> list[ScheduleMailWithSenderDetails]:
        condition = {"sender_link_mail_address_id": {"$in": linked_mail_address_ids}}
        res = await self.aggregate(
            collection=self.collection,
            pipeline=[
                {
                    "$lookup": {
                        "from": "link_mail_address",
                        "localField": "sender_link_mail_address_id",
                        "foreignField": "_id",
                        "as": "sender_details",
                    }
                },
                {
                    "$project": {
                        "id": "$_id",
                        "subject": 1,
                        "body": 1,
                        "status": 1,
                        "scheduled_at": 1,
                        "receiver": 1,
                        "sender_link_mail_address_id": 1,
                        "sender_details.username": 1,
                        "sender_details.email": 1,
                    }
                },
                {"$unwind": {"path": "$sender_details"}},
                {"$match": condition},
                {"$sort": {"scheduled_at": -1}},
            ],
        )
        return [
            ScheduleMailWithSenderDetails(
                **{
                    **doc,
                    "sender_details": SenderDetails(
                        username=doc.get("sender_details").get("username"), email=doc.get("sender_details").get("email")
                    ),
                }
            )
            for doc in res
        ]

    async def get_scheduled_mails(
        self, scheduled_mail_ids: list[Annotated[ObjectId, ObjectIdPydanticAnnotation]]
    ) -> list[ScheduleMailWithSenderDetails]:
        condition = {"_id": {"$in": scheduled_mail_ids}}
        res = await self.aggregate(
            collection=self.collection,
            pipeline=[
                {
                    "$lookup": {
                        "from": "link_mail_address",
                        "localField": "sender_link_mail_address_id",
                        "foreignField": "_id",
                        "as": "sender_details",
                    }
                },
                {
                    "$project": {
                        "id": "$_id",
                        "subject": 1,
                        "body": 1,
                        "status": 1,
                        "scheduled_at": 1,
                        "receiver": 1,
                        "sender_link_mail_address_id": 1,
                        "sender_details.username": 1,
                        "sender_details.email": 1,
                    }
                },
                {"$match": condition},
                {"$unwind": {"path": "$sender_details"}},
            ],
        )
        return [
            ScheduleMailWithSenderDetails(
                **{
                    **doc,
                    "sender_details": SenderDetails(
                        username=doc.get("sender_details").get("username"), email=doc.get("sender_details").get("email")
                    ),
                }
            )
            for doc in res
        ]

    async def update_schedule_mail(
        self, schedule_mail_id: Annotated[ObjectId, ObjectIdPydanticAnnotation], data: ScheduleMail
    ):
        return await self.update(
            self.collection,
            {"_id": schedule_mail_id},
            data.dict(exclude_unset=True, exclude_none=True),
        )
