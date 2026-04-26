from typing import Annotated, AsyncIterator

from aioredis import Redis
from fastapi import Depends

from src.common.database.connection import get_redis_session
from src.logger import LOGGER


class PubSubService:
    def __init__(self, redis: Annotated[Redis, Depends(get_redis_session)]):
        self.redis = redis

    async def publish(self, channel: str, payload: str) -> int:
        """
        Publish a single message to a Redis channel.

        Returns the number of subscribers that received the message.
        Logs and swallows aioredis errors so the caller (e.g. notification
        insert) is not failed by an unhealthy Redis.
        """
        try:
            return int(await self.redis.publish(channel, payload))
        except Exception as exc:  # noqa: BLE001 — best-effort fan-out
            LOGGER.warning("pubsub.publish failed for channel %s: %s", channel, exc)
            return 0

    async def subscribe(self, channel: str) -> AsyncIterator[bytes]:
        """
        Async iterator yielding raw payload bytes for messages on the channel.
        """
        pubsub = self.redis.pubsub()
        await pubsub.subscribe(channel)
        try:
            async for message in pubsub.listen():
                if message and message.get("type") == "message":
                    yield message["data"]
        finally:
            await pubsub.unsubscribe(channel)
            await pubsub.close()
