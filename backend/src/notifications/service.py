import asyncio
import secrets
import time
from typing import Annotated, AsyncIterator

from aioredis import Redis
from fastapi import Depends, HTTPException, status

from src.common.database.connection import get_redis_session
from src.common.pubsub import PubSubService
from src.logger import LOGGER

TICKET_TTL_SECONDS = 30
PING_INTERVAL_SECONDS = 25
POLL_INTERVAL_SECONDS = 5


class NotificationStreamService:
    def __init__(
        self,
        redis: Annotated[Redis, Depends(get_redis_session)],
        pubsub: Annotated[PubSubService, Depends()],
    ):
        self.redis = redis
        self.pubsub = pubsub

    async def issue_ticket(self, username: str) -> dict:
        ticket = secrets.token_urlsafe(24)
        await self.redis.set(f"sse_ticket:{ticket}", username, ex=TICKET_TTL_SECONDS)
        return {"ticket": ticket, "expires_in": TICKET_TTL_SECONDS}

    async def consume_ticket(self, ticket: str) -> str:
        # Atomic GETDEL — single use.
        username = await self.redis.execute_command("GETDEL", f"sse_ticket:{ticket}")
        if not username:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired ticket")
        return username.decode() if isinstance(username, bytes) else username

    async def event_generator(self, request, username: str) -> AsyncIterator[str]:
        channel = f"notif:{username}"
        pubsub_conn = self.redis.pubsub()
        try:
            await pubsub_conn.subscribe(channel)
            yield "event: ready\ndata: {}\n\n"
            last_ping = time.monotonic()
            while True:
                if await request.is_disconnected():
                    break
                try:
                    message = await pubsub_conn.get_message(
                        ignore_subscribe_messages=True, timeout=POLL_INTERVAL_SECONDS
                    )
                except asyncio.CancelledError:
                    break
                if message and message.get("type") == "message":
                    data = message["data"]
                    if isinstance(data, bytes):
                        data = data.decode()
                    yield f"event: new\ndata: {data}\n\n"
                if time.monotonic() - last_ping >= PING_INTERVAL_SECONDS:
                    yield ": ping\n\n"
                    last_ping = time.monotonic()
        finally:
            try:
                await pubsub_conn.unsubscribe(channel)
                await pubsub_conn.close()
            except Exception as exc:  # noqa: BLE001
                LOGGER.warning("pubsub close failed: %s", exc)
