import asyncio
from unittest.mock import AsyncMock, MagicMock

import pytest

from backend.src.notifications.service import NotificationStreamService


def _svc():
    svc = NotificationStreamService.__new__(NotificationStreamService)
    svc.redis = MagicMock()
    svc.redis.set = AsyncMock(return_value=True)
    svc.redis.execute_command = AsyncMock()
    svc.pubsub = MagicMock()
    return svc


def test_issue_ticket_writes_to_redis_with_ttl():
    svc = _svc()
    result = asyncio.run(svc.issue_ticket("alice"))
    assert "ticket" in result
    assert result["expires_in"] == 30
    svc.redis.set.assert_awaited_once()
    args, kwargs = svc.redis.set.await_args
    assert args[0] == f"sse_ticket:{result['ticket']}"
    assert args[1] == "alice"
    assert kwargs["ex"] == 30


def test_consume_ticket_returns_username_on_hit():
    svc = _svc()
    svc.redis.execute_command = AsyncMock(return_value=b"alice")
    username = asyncio.run(svc.consume_ticket("abc"))
    assert username == "alice"
    svc.redis.execute_command.assert_awaited_once_with("GETDEL", "sse_ticket:abc")


def test_consume_ticket_401_on_miss():
    svc = _svc()
    svc.redis.execute_command = AsyncMock(return_value=None)
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as ei:
        asyncio.run(svc.consume_ticket("abc"))
    assert ei.value.status_code == 401


def test_event_generator_yields_ready_then_forwards_message_then_breaks_on_disconnect():
    svc = _svc()

    pubsub_conn = MagicMock()
    pubsub_conn.subscribe = AsyncMock()
    pubsub_conn.unsubscribe = AsyncMock()
    pubsub_conn.close = AsyncMock()
    messages = [
        {"type": "message", "data": b'{"type":"new_important_mail","notifications":[]}'},
        None,
    ]

    async def get_message(**_kwargs):
        return messages.pop(0)

    pubsub_conn.get_message = get_message
    svc.redis.pubsub = MagicMock(return_value=pubsub_conn)

    request = MagicMock()
    disconnect_after_n_calls = {"n": 0}

    async def is_disconnected():
        disconnect_after_n_calls["n"] += 1
        # connected for first 3 polls, then drop
        return disconnect_after_n_calls["n"] >= 3

    request.is_disconnected = is_disconnected

    async def collect():
        out = []
        async for chunk in svc.event_generator(request, "alice"):
            out.append(chunk)
        return out

    chunks = asyncio.run(collect())
    assert chunks[0] == "event: ready\ndata: {}\n\n"
    assert any(c.startswith("event: new\n") for c in chunks)
    pubsub_conn.subscribe.assert_awaited_once_with("notif:alice")
    pubsub_conn.unsubscribe.assert_awaited_once_with("notif:alice")
