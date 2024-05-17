from typing import Annotated

from aioredis import Redis
from fastapi import Depends

from src.common.database.connection import get_redis_session


class WebSocketRepository:
    def __init__(self, client: Annotated[Redis, Depends(get_redis_session)]):
        self.client = client

    async def set_item(self, key: str, value: str):
        return await self.client.set(key, value)
