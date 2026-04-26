from typing import Annotated, Optional

from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from backend.src.common.base_repository import BaseRepository
from backend.src.common.database.connection import get_db_session
from backend.src.mails.models import AISummary


class AISummaryRepository(BaseRepository):
    def __init__(self, db: Annotated[AsyncIOMotorDatabase, Depends(get_db_session)]):
        super().__init__(db)
        self.collection = self.db["ai_summaries"]

    async def get_by_hash(self, content_hash: str) -> Optional[dict]:
        return await self.query(self.collection, {"content_hash": content_hash})

    async def insert_summary(self, summary: AISummary) -> AISummary:
        await self.collection.update_one(
            {"content_hash": summary.content_hash},
            {"$setOnInsert": summary.dict()},
            upsert=True,
        )
        return summary
