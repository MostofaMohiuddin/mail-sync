from typing import Annotated

from bson import ObjectId
from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from backend.src.common.base_repository import BaseRepository
from backend.src.common.database.connection import get_db_session

from backend.src.common.models import ObjectIdPydanticAnnotation
from backend.src.important_mail.models import ImportantMailClassification, ImportantMailNotification, NotificationStatus


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
        print("linked_mail_address_ids", linked_mail_address_ids)
        condition = {"linked_mail_address_id": {"$in": linked_mail_address_ids}}

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


class ImportantMailClassificationRepository(BaseRepository):
    def __init__(self, db: Annotated[AsyncIOMotorDatabase, Depends(get_db_session)]):
        super().__init__(db)
        self.collection = self.db["important_mail_classifications"]

    async def ensure_indexes(self):
        await self.collection.create_index("mail_id", unique=True)

    async def get_by_mail_ids(self, mail_ids: list[str]) -> dict[str, bool]:
        cursor = self.collection.find({"mail_id": {"$in": mail_ids}})
        out: dict[str, bool] = {}
        async for doc in cursor:
            out[doc["mail_id"]] = bool(doc["is_important"])
        return out

    async def upsert_many(self, rows: list["ImportantMailClassification"]) -> None:
        if not rows:
            return
        for row in rows:
            await self.collection.update_one(
                {"mail_id": row.mail_id},
                {"$set": row.dict()},
                upsert=True,
            )
