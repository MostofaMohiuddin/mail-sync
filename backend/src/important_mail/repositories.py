from typing import Annotated

from bson import ObjectId
from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from backend.src.common.base_repository import BaseRepository
from backend.src.common.database.connection import get_db_session

from backend.src.common.models import ObjectIdPydanticAnnotation
from backend.src.important_mail.models import ImportantMailNotification, NotificationStatus


class ImportantMailNotificationRepository(BaseRepository):
    def __init__(self, db: Annotated[AsyncIOMotorDatabase, Depends(get_db_session)]):
        super().__init__(db)
        self.collection = self.db["important_mail_notifications"]

    async def add_notifications(self, notifications: list[ImportantMailNotification]):
        return await self.insert_many(
            self.collection,
            notifications,
        )

    async def get_notifications(self, linked_mail_address_ids: list[Annotated[ObjectId, ObjectIdPydanticAnnotation]]):
        condition = {
            "$and": [
                {"linked_mail_address_id": {"$in": linked_mail_address_ids}},
                {"status": NotificationStatus.UNREAD},
            ]
        }
        data = await self.aggregate(
            self.collection,
            [
                {
                    "$match": condition,
                },
                {
                    "$project": {
                        "id": "$_id",
                        "linked_mail_address_id": 1,
                        "mail_metadata": 1,
                        "status": 1,
                    }
                },
            ],
        )
        return data

    async def mark_notification_as_read(self, notification_ids: list[Annotated[ObjectId, ObjectIdPydanticAnnotation]]):
        await self.update_many(
            self.collection,
            {"_id": {"$in": notification_ids}},
            {"status": NotificationStatus.READ},
        )
