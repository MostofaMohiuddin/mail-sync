import asyncio
from unittest.mock import AsyncMock, MagicMock

import pytest

from backend.src.google.models import UserInfo
from backend.src.important_mail.dtos import ClassifyBatchRequest, MailMetaDataInput
from backend.src.important_mail.service import ImportantMailService


def _mail(
    mail_id: str = "m1",
    sender_email: str = "alice@example.com",
    receiver_email: str = "me@example.com",
    subject: str = "Hi",
    snippet: str = "hello",
) -> MailMetaDataInput:
    return MailMetaDataInput(
        id=mail_id,
        history_id="100",
        subject=subject,
        snippet=snippet,
        sender=UserInfo(email=sender_email, name=""),
        receiver=UserInfo(email=receiver_email, name=""),
        date="Fri, 26 Apr 2026 10:00:00 +0000",
    )


def _service(cache: dict | None = None, openai_results: list[dict] | None = None) -> ImportantMailService:
    svc = ImportantMailService.__new__(ImportantMailService)
    svc.openai_client = MagicMock()
    svc.openai_client.detect_important_batch = MagicMock(return_value=openai_results or [])
    svc.important_mail_notification_repository = MagicMock()
    svc.link_mail_address_service = MagicMock()
    svc.important_mail_classification_repository = MagicMock()
    svc.important_mail_classification_repository.get_by_mail_ids = AsyncMock(return_value=cache or {})
    svc.important_mail_classification_repository.upsert_many = AsyncMock()
    return svc


def test_self_sender_is_not_important_and_skips_openai():
    svc = _service()
    request = ClassifyBatchRequest(
        mails=[_mail(sender_email="me@example.com", receiver_email="me@example.com")]
    )
    response = asyncio.run(svc.classify_batch(request))
    assert response.results == [
        type(response.results[0])(mail_id="m1", is_important=False, reason="self_sender")
    ]
    svc.openai_client.detect_important_batch.assert_not_called()


def test_noreply_local_part_is_not_important():
    svc = _service()
    request = ClassifyBatchRequest(mails=[_mail(sender_email="no-reply@anything.com")])
    response = asyncio.run(svc.classify_batch(request))
    assert response.results[0].is_important is False
    assert response.results[0].reason == "noreply_local_part"
    svc.openai_client.detect_important_batch.assert_not_called()


def test_known_bulk_sender_domain_is_not_important():
    svc = _service()
    request = ClassifyBatchRequest(mails=[_mail(sender_email="news@mailchimp.com")])
    response = asyncio.run(svc.classify_batch(request))
    assert response.results[0].is_important is False
    assert response.results[0].reason == "known_bulk_sender"
    svc.openai_client.detect_important_batch.assert_not_called()


def test_cache_hit_skips_openai():
    svc = _service(cache={"m1": True})
    request = ClassifyBatchRequest(mails=[_mail("m1", sender_email="alice@example.com")])
    response = asyncio.run(svc.classify_batch(request))
    assert response.results[0].is_important is True
    assert response.results[0].reason == "cached"
    svc.openai_client.detect_important_batch.assert_not_called()


def test_uncached_uncovered_mail_calls_openai_once():
    svc = _service(openai_results=[{"id": "m1", "important": True, "reason": "real person"}])
    request = ClassifyBatchRequest(mails=[_mail("m1", sender_email="alice@example.com")])
    response = asyncio.run(svc.classify_batch(request))
    assert response.results[0].is_important is True
    svc.openai_client.detect_important_batch.assert_called_once()


def test_results_are_returned_in_input_order_with_mixed_routes():
    svc = _service(
        cache={"m2": False},
        openai_results=[{"id": "m3", "important": True, "reason": "real"}],
    )
    request = ClassifyBatchRequest(
        mails=[
            _mail("m1", sender_email="me@example.com", receiver_email="me@example.com"),  # self → false
            _mail("m2", sender_email="alice@example.com"),  # cache → false
            _mail("m3", sender_email="bob@example.com"),  # openai → true
        ]
    )
    response = asyncio.run(svc.classify_batch(request))
    assert [r.mail_id for r in response.results] == ["m1", "m2", "m3"]
    assert [r.is_important for r in response.results] == [False, False, True]
    # Only m3 should be in the OpenAI batch
    call_args = svc.openai_client.detect_important_batch.call_args.args[0]
    assert [m["id"] for m in call_args] == ["m3"]


def test_uncached_results_are_persisted_to_cache():
    svc = _service(openai_results=[{"id": "m1", "important": True, "reason": "real"}])
    request = ClassifyBatchRequest(mails=[_mail("m1", sender_email="alice@example.com")])
    asyncio.run(svc.classify_batch(request))
    svc.important_mail_classification_repository.upsert_many.assert_awaited_once()
    persisted = svc.important_mail_classification_repository.upsert_many.await_args.args[0]
    assert [r.mail_id for r in persisted] == ["m1"]
    assert persisted[0].is_important is True


def test_pre_filter_results_are_also_persisted_to_cache():
    svc = _service()
    request = ClassifyBatchRequest(
        mails=[_mail("m1", sender_email="news@mailchimp.com")]
    )
    asyncio.run(svc.classify_batch(request))
    persisted = svc.important_mail_classification_repository.upsert_many.await_args.args[0]
    assert [r.mail_id for r in persisted] == ["m1"]
    assert persisted[0].is_important is False


def test_empty_request_returns_empty_response_without_openai():
    svc = _service()
    response = asyncio.run(svc.classify_batch(ClassifyBatchRequest(mails=[])))
    assert response.results == []
    svc.openai_client.detect_important_batch.assert_not_called()
