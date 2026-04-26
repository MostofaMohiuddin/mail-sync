import asyncio
from unittest.mock import AsyncMock, MagicMock

import pytest

from backend.src.mails import service as service_module
from backend.src.mails.models import (
    ProcessMailWithAIRequestBody,
    ProcessMailWithAIRequestTone,
    ProcessMailWithAIRequestType,
)
from backend.src.mails.service import MailSyncService


@pytest.fixture
def service():
    svc = MailSyncService.__new__(MailSyncService)
    svc.openai_client = MagicMock()
    svc.ai_summary_repository = MagicMock()
    svc.ai_summary_repository.get_by_hash = AsyncMock(return_value=None)
    svc.ai_summary_repository.insert_summary = AsyncMock()
    return svc


@pytest.fixture(autouse=True)
def _clear_reply_cache():
    service_module._REPLY_CACHE.clear()
    yield
    service_module._REPLY_CACHE.clear()


def test_reply_prompt_without_tone_matches_default(service):
    request = ProcessMailWithAIRequestBody(
        message="Hi there",
        request_type=ProcessMailWithAIRequestType.REPLY,
    )
    result = service._generate_prompt(request)
    assert "Tone:" not in result["system_prompt"]
    assert result["system_prompt"].startswith("You are a mail writer.")
    assert "Hi there" in result["prompt"]


@pytest.mark.parametrize(
    "tone,expected_phrase",
    [
        (ProcessMailWithAIRequestTone.FRIENDLY, "warm, friendly tone"),
        (ProcessMailWithAIRequestTone.CONCISE, "short and to the point"),
        (ProcessMailWithAIRequestTone.FORMAL, "professional, formal tone"),
        (ProcessMailWithAIRequestTone.DECLINE, "Politely decline"),
        (ProcessMailWithAIRequestTone.ENTHUSIASTIC, "genuine enthusiasm"),
    ],
)
def test_reply_prompt_with_tone_appends_tone_instruction(service, tone, expected_phrase):
    request = ProcessMailWithAIRequestBody(
        message="Hi there",
        request_type=ProcessMailWithAIRequestType.REPLY,
        tone=tone,
    )
    result = service._generate_prompt(request)
    assert "Tone:" in result["system_prompt"]
    assert expected_phrase in result["system_prompt"]


def test_summary_prompt_ignores_tone(service):
    request = ProcessMailWithAIRequestBody(
        message="Hi there",
        request_type=ProcessMailWithAIRequestType.SUMMARY,
        tone=ProcessMailWithAIRequestTone.FRIENDLY,
    )
    result = service._generate_prompt(request)
    assert "Tone:" not in result["system_prompt"]


def test_generate_prompt_ignores_tone(service):
    request = ProcessMailWithAIRequestBody(
        message="Status update",
        request_type=ProcessMailWithAIRequestType.GENERATE,
        tone=ProcessMailWithAIRequestTone.FORMAL,
    )
    result = service._generate_prompt(request)
    assert "Tone:" not in result["system_prompt"]


def test_summary_returns_db_cached_value_without_calling_llm(service):
    service.ai_summary_repository.get_by_hash = AsyncMock(
        return_value={"summary": "<ul><li>cached</li></ul>"}
    )
    request = ProcessMailWithAIRequestBody(
        message="hello", request_type=ProcessMailWithAIRequestType.SUMMARY
    )

    result = asyncio.run(service.process_mail_with_ai(request))

    assert result == {"processed_mail": "<ul><li>cached</li></ul>"}
    service.openai_client.get_completion.assert_not_called()
    service.ai_summary_repository.insert_summary.assert_not_called()


def test_summary_calls_llm_and_persists_when_db_misses(service):
    service.openai_client.get_completion.return_value = "<ul><li>fresh</li></ul>"
    request = ProcessMailWithAIRequestBody(
        message="hello", request_type=ProcessMailWithAIRequestType.SUMMARY
    )

    result = asyncio.run(service.process_mail_with_ai(request))

    assert result == {"processed_mail": "<ul><li>fresh</li></ul>"}
    service.openai_client.get_completion.assert_called_once()
    service.ai_summary_repository.insert_summary.assert_awaited_once()
    persisted = service.ai_summary_repository.insert_summary.await_args.args[0]
    assert persisted.summary == "<ul><li>fresh</li></ul>"
    assert len(persisted.content_hash) == 64


def test_reply_caches_in_process_keyed_by_message_and_tone(service):
    service.openai_client.get_completion.return_value = "<p>draft</p>"
    request = ProcessMailWithAIRequestBody(
        message="hello",
        request_type=ProcessMailWithAIRequestType.REPLY,
        tone=ProcessMailWithAIRequestTone.FRIENDLY,
    )

    first = asyncio.run(service.process_mail_with_ai(request))
    second = asyncio.run(service.process_mail_with_ai(request))

    assert first == second == {"processed_mail": "<p>draft</p>"}
    service.openai_client.get_completion.assert_called_once()


def test_reply_cache_key_changes_with_tone(service):
    service.openai_client.get_completion.side_effect = [
        "<p>friendly draft</p>",
        "<p>formal draft</p>",
    ]
    base = {"message": "hello", "request_type": ProcessMailWithAIRequestType.REPLY}

    friendly = asyncio.run(
        service.process_mail_with_ai(
            ProcessMailWithAIRequestBody(**base, tone=ProcessMailWithAIRequestTone.FRIENDLY)
        )
    )
    formal = asyncio.run(
        service.process_mail_with_ai(
            ProcessMailWithAIRequestBody(**base, tone=ProcessMailWithAIRequestTone.FORMAL)
        )
    )

    assert friendly == {"processed_mail": "<p>friendly draft</p>"}
    assert formal == {"processed_mail": "<p>formal draft</p>"}
    assert service.openai_client.get_completion.call_count == 2


def test_generate_does_not_use_caches(service):
    service.openai_client.get_completion.return_value = "<div>generated</div>"
    request = ProcessMailWithAIRequestBody(
        message="write something",
        request_type=ProcessMailWithAIRequestType.GENERATE,
    )

    first = asyncio.run(service.process_mail_with_ai(request))
    second = asyncio.run(service.process_mail_with_ai(request))

    assert first == second == {"processed_mail": "<div>generated</div>"}
    assert service.openai_client.get_completion.call_count == 2
    service.ai_summary_repository.get_by_hash.assert_not_called()
