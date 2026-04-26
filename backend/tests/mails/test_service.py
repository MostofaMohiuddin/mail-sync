from unittest.mock import MagicMock

import pytest

from src.mails.models import (
    ProcessMailWithAIRequestBody,
    ProcessMailWithAIRequestTone,
    ProcessMailWithAIRequestType,
)
from src.mails.service import MailSyncService


@pytest.fixture
def service():
    svc = MailSyncService.__new__(MailSyncService)
    svc.openai_client = MagicMock()
    return svc


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
