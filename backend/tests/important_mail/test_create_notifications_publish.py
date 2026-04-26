import asyncio
import json
from unittest.mock import AsyncMock, MagicMock

from bson import ObjectId

from backend.src.google.models import EmailMetadata, UserInfo
from backend.src.important_mail.models import ImportantMailNotification
from backend.src.important_mail.service import ImportantMailService


def _service():
    svc = ImportantMailService.__new__(ImportantMailService)
    svc.openai_client = MagicMock()
    svc.important_mail_notification_repository = MagicMock()
    svc.important_mail_notification_repository.add_notifications = AsyncMock(
        side_effect=lambda notifs: notifs
    )
    svc.important_mail_classification_repository = MagicMock()
    svc.link_mail_address_service = MagicMock()
    svc.pubsub = MagicMock()
    svc.pubsub.publish = AsyncMock(return_value=1)
    return svc


def _notif(linked_id: ObjectId, mail_id: str = "m1") -> ImportantMailNotification:
    return ImportantMailNotification(
        linked_mail_address_id=linked_id,
        mail_metadata=EmailMetadata(
            sender=UserInfo(email="alice@example.com", name=""),
            receiver=UserInfo(email="me@example.com", name=""),
            subject="Hi",
            date="Fri, 26 Apr 2026 10:00:00 +0000",
            snippet="hello",
            id=mail_id,
            history_id="100",
        ),
    )


def test_publishes_one_message_per_username():
    svc = _service()
    addr_a = ObjectId()
    addr_b = ObjectId()
    svc.link_mail_address_service.get_usernames_by_ids = AsyncMock(
        return_value={addr_a: "alice", addr_b: "bob"}
    )

    notifs = [_notif(addr_a, "m1"), _notif(addr_b, "m2"), _notif(addr_a, "m3")]
    asyncio.run(svc.create_important_mail_notification(notifs))

    assert svc.pubsub.publish.await_count == 2
    calls = {call.args[0]: json.loads(call.args[1]) for call in svc.pubsub.publish.await_args_list}
    assert "notif:alice" in calls
    assert "notif:bob" in calls
    assert calls["notif:alice"]["type"] == "new_important_mail"
    assert {n["mail_metadata"]["id"] for n in calls["notif:alice"]["notifications"]} == {"m1", "m3"}
    assert {n["mail_metadata"]["id"] for n in calls["notif:bob"]["notifications"]} == {"m2"}


def test_publish_failure_does_not_break_insert():
    svc = _service()
    svc.pubsub.publish = AsyncMock(side_effect=RuntimeError("redis down"))
    addr = ObjectId()
    svc.link_mail_address_service.get_usernames_by_ids = AsyncMock(return_value={addr: "alice"})

    # Should NOT raise — the Mongo insert has already happened.
    result = asyncio.run(svc.create_important_mail_notification([_notif(addr)]))
    assert len(result) == 1
    svc.important_mail_notification_repository.add_notifications.assert_awaited_once()


def test_no_publish_when_no_notifications():
    svc = _service()
    svc.link_mail_address_service.get_usernames_by_ids = AsyncMock(return_value={})

    asyncio.run(svc.create_important_mail_notification([]))
    svc.pubsub.publish.assert_not_called()
