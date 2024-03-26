from typing import Annotated
import aioredis

from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from src.env_config import (
    MONGO_HOST,
    MONGO_PASSWORD,
    MONGO_PORT,
    MONGO_PREFIX,
    MONGO_USERNAME,
)
from src.logger import LOGGER


class MongoDB:
    _client = None

    def __new__(cls):
        if not hasattr(cls, "instance"):
            cls.instance = super(MongoDB, cls).__new__(cls)
        return cls.instance

    def get_db_url(self) -> str:
        return f"{MONGO_PREFIX}://{MONGO_USERNAME}:{MONGO_PASSWORD}@{MONGO_HOST}:{MONGO_PORT}"

    async def get_client(self):
        if not self._client:
            LOGGER.info(f"Connecting to MongoDB at {MONGO_HOST}:{MONGO_PORT}")
            self._client = AsyncIOMotorClient(self.get_db_url())
        return self._client


async def get_db_session(mongo_db: Annotated[MongoDB, Depends()]) -> AsyncIOMotorDatabase:
    LOGGER.debug("Get DB session")
    client = await mongo_db.get_client()
    return client["admin"]


class RedisDB:
    _client = None

    def __new__(cls):
        if not hasattr(cls, "instance"):
            cls.instance = super(RedisDB, cls).__new__(cls)
        return cls.instance

    def get_redis_url(self) -> str:
        return "redis://redis:6379/0"

    async def get_client(self):
        if not self._client:
            LOGGER.info(f"Connecting to Redis")
            self._client = await aioredis.from_url(self.get_redis_url())
        return self._client


async def get_redis_session(redis: Annotated[RedisDB, Depends()]) -> aioredis.Redis:
    client = await redis.get_client()
    return client
