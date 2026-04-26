# Notification & Polling Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 2-minute sequential polling loop and 10s SWR polling with a smart Go worker (parallel, per-address Redis lock, batched OpenAI classification, 30s tick) plus an SSE push channel from the FastAPI backend to the React frontend, fanned out via Redis Pub/Sub.

**Architecture:**
- **Worker (Go):** every 30s, dispatch all linked addresses through an 8-goroutine pool. Each goroutine acquires a per-address Redis lock, calls `GET /history`, batches the response into a single `POST /important-mail/classify-batch`, posts notifications, and updates `LastMailHistoryId`. No panics, no cumulative-slice bug.
- **Backend (FastAPI):** new `POST /important-mail/classify-batch` (pre-filter → cache → single batched OpenAI call → cache write → response). `POST /important-mail/notifications` additionally publishes to `notif:{username}` on Redis. New `GET /notifications/stream` SSE endpoint subscribes per-user and yields events.
- **Frontend (React):** new `useNotificationStream` hook opens an `EventSource`, optimistically prepends notifications into the SWR cache on `event: new`, and the existing 10s `refreshInterval` is removed.

**Tech Stack:** FastAPI + Pydantic + Motor + aioredis (backend); Go 1.22 + `robfig/cron` + `go-redis/v9` (worker); React + TypeScript + SWR (frontend); MongoDB + Redis (infra); nginx (reverse proxy).

**Spec:** `docs/superpowers/specs/2026-04-26-notification-and-polling-overhaul-design.md`

---

## File Structure

**Backend (create):**
- `backend/src/important_mail/dtos.py` — modify: add `ClassifyBatchRequest`, `ClassifyBatchResponse`, `ClassifyBatchResultRow`, `MailMetaDataInput`.
- `backend/src/important_mail/models.py` — modify: add `ImportantMailClassification` model.
- `backend/src/important_mail/repositories.py` — modify: add `ImportantMailClassificationRepository`.
- `backend/src/important_mail/service.py` — modify: add `classify_batch`, modify `create_important_mail_notification` to publish.
- `backend/src/important_mail/routes.py` — modify: add `POST /classify-batch` route.
- `backend/src/openai/openai_client.py` — modify: add `detect_important_batch`.
- `backend/src/common/pubsub.py` — create: thin wrapper over aioredis `publish` and `pubsub().subscribe`.
- `backend/src/notifications/__init__.py` — create.
- `backend/src/notifications/routes.py` — create: `POST /stream/ticket` and `GET /stream`.
- `backend/src/notifications/service.py` — create: ticket exchange + SSE event generator.
- `backend/main.py` — modify: register `notifications_router`, drop `web_socket_router`.

**Backend (delete):**
- `backend/src/web_socket/` — entire dir (stub, never used).
- `backend/src/mail_notification/` — entire dir (only contains unused `MailHistory` model).

**Backend tests (create):**
- `backend/tests/important_mail/__init__.py`
- `backend/tests/important_mail/test_classify_batch.py`
- `backend/tests/important_mail/test_create_notifications_publish.py`
- `backend/tests/notifications/__init__.py`
- `backend/tests/notifications/test_stream.py`

**Worker (create):**
- `worker/internal/redis/client.go` — wraps `go-redis/v9` client singleton.
- `worker/internal/lock/redis_lock.go` — `Acquire(key, ttl) (token, ok)` + `Release(key, token)` via Lua.
- `worker/internal/lock/redis_lock_test.go` — acquire/release tests.
- `worker/internal/pool/pool.go` — generic worker-pool helper.
- `worker/internal/pool/pool_test.go` — pool concurrency tests.

**Worker (modify):**
- `worker/internal/config/config.go` — add `RedisURL`.
- `worker/internal/mailsync/types.go` — add `ClassifyBatchRequest`, `ClassifyBatchResponse`, `ClassifyBatchResult`.
- `worker/internal/mailsync/service.go` — add `ClassifyBatch`; remove `panic` paths.
- `worker/internal/important_mail_notification/service.go` — full rewrite.
- `worker/internal/important_mail_notification/service_test.go` — create: regression + happy-path tests.
- `worker/cmd/cronjob/main.go` — change cron expression to `@every 30s`; pass redis client into the service.
- `worker/go.mod` / `worker/go.sum` — add `github.com/redis/go-redis/v9` and `github.com/google/uuid`.

**Frontend (create):**
- `frontend/src/hooks/useNotificationStream/index.ts` — EventSource lifecycle + reconnect + visibility handling.

**Frontend (modify):**
- `frontend/src/api/ImportantMailNotification.ts` — add `getNotificationStreamTicket`.
- `frontend/src/hooks/userSession/index.tsx` — drop `refreshInterval: 10000`, mount `useNotificationStream`.
- `frontend/src/components/layout/Header.tsx` — `await` API before `mutate` in `markAllAsRead`.

**Infra (modify):**
- `nginx/nginx.conf` — add SSE-friendly `location /api/notifications/stream` block before generic `/api/`.

---

## Phase 1 — Backend: classify-batch endpoint + classification cache

This phase is independently shippable. No frontend or worker code calls it yet.

### Task 1.1: Add classify-batch DTOs

**Files:**
- Modify: `backend/src/important_mail/dtos.py`

- [ ] **Step 1: Add the new DTOs**

Replace the entire contents of `backend/src/important_mail/dtos.py` with:

```python
from typing import Optional

from pydantic import BaseModel

from backend.src.google.models import UserInfo
from backend.src.important_mail.models import ImportantMailNotification


class ImportantMailDetectRequest(BaseModel):
    subject: str
    sender: str
    snippet: str


class ImportantMailNotificationRequest(BaseModel):
    notifications: list[ImportantMailNotification]


class MailMetaDataInput(BaseModel):
    """
    Mirrors the Go worker's MailMetaData JSON shape.
    """

    id: str
    history_id: str
    subject: str
    snippet: str
    sender: UserInfo
    receiver: UserInfo
    date: str


class ClassifyBatchRequest(BaseModel):
    mails: list[MailMetaDataInput]


class ClassifyBatchResultRow(BaseModel):
    mail_id: str
    is_important: bool
    reason: Optional[str] = None


class ClassifyBatchResponse(BaseModel):
    results: list[ClassifyBatchResultRow]
```

- [ ] **Step 2: Sanity-check imports compile**

```bash
cd /Users/mostofa.mohiuddin/Work/rnd/mail-sync && PYTHONPATH=. backend/.venv/bin/python -c "from backend.src.important_mail.dtos import ClassifyBatchRequest, ClassifyBatchResponse, MailMetaDataInput, ClassifyBatchResultRow; print('ok')"
```

Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add backend/src/important_mail/dtos.py
git commit -m "feat(backend): add classify-batch DTOs for important_mail"
```

---

### Task 1.2: Add `ImportantMailClassification` model and repository

**Files:**
- Modify: `backend/src/important_mail/models.py`
- Modify: `backend/src/important_mail/repositories.py`

- [ ] **Step 1: Add the model**

Append to `backend/src/important_mail/models.py`:

```python


class ImportantMailClassification(BaseModel):
    mail_id: str
    is_important: bool
    reason: Optional[str] = None
    classified_at: str
```

- [ ] **Step 2: Add the repository class**

Append to `backend/src/important_mail/repositories.py`:

```python


class ImportantMailClassificationRepository(BaseRepository):
    def __init__(self, db: Annotated[AsyncIOMotorDatabase, Depends(get_db_session)]):
        super().__init__(db)
        self.collection = self.db["important_mail_classifications"]

    async def ensure_indexes(self):
        await self.collection.create_index("mail_id", unique=True)

    async def get_by_mail_ids(self, mail_ids: list[str]) -> dict[str, bool]:
        cursor = self.collection.find({"mail_id": {"$in": mail_ids}})
        out: dict[str, bool] = {}
        async for doc in cursor:
            out[doc["mail_id"]] = bool(doc["is_important"])
        return out

    async def upsert_many(self, rows: list["ImportantMailClassification"]) -> None:
        if not rows:
            return
        for row in rows:
            await self.collection.update_one(
                {"mail_id": row.mail_id},
                {"$set": row.dict()},
                upsert=True,
            )
```

Add the import at the top of the file:

```python
from backend.src.important_mail.models import ImportantMailClassification, ImportantMailNotification, NotificationStatus
```

(replace the existing single-line `from backend.src.important_mail.models import ImportantMailNotification, NotificationStatus`).

- [ ] **Step 3: Verify imports compile**

```bash
cd /Users/mostofa.mohiuddin/Work/rnd/mail-sync && PYTHONPATH=. backend/.venv/bin/python -c "from backend.src.important_mail.repositories import ImportantMailClassificationRepository; from backend.src.important_mail.models import ImportantMailClassification; print('ok')"
```

Expected: `ok`

- [ ] **Step 4: Commit**

```bash
git add backend/src/important_mail/models.py backend/src/important_mail/repositories.py
git commit -m "feat(backend): add ImportantMailClassification model + repository"
```

---

### Task 1.3: Add `OpenAIClient.detect_important_batch`

**Files:**
- Modify: `backend/src/openai/openai_client.py`

- [ ] **Step 1: Add the method**

Append to `backend/src/openai/openai_client.py` (inside the `OpenAIClient` class, below `get_completion`):

```python
    def detect_important_batch(self, mails: list[dict]) -> list[dict]:
        """
        Classify a batch of mails in a single OpenAI call.

        Each mail dict must include: id, subject, sender_email, snippet.
        Returns: list of {"id": str, "important": bool, "reason": str}
        """
        if not mails:
            return []

        rendered = "\n\n".join(
            (
                f"---\nID: {m['id']}\n"
                f"From: {m['sender_email']}\n"
                f"Subject: {m['subject']}\n"
                f"Snippet: {m['snippet']}"
            )
            for m in mails
        )
        system = (
            "You classify emails as important or not. "
            "Promotional, marketing, and automated notifications are NOT important. "
            "Personal mail, replies from real people, work-related threads ARE important. "
            "For each input email return one JSON object with keys id (string), "
            "important (boolean), reason (short string)."
        )
        user = (
            "Classify the following emails. Reply ONLY with a JSON object of the form "
            "{\"results\": [{\"id\": \"...\", \"important\": true, \"reason\": \"...\"}]} "
            "with one entry per input in the same order.\n\n"
            f"{rendered}"
        )

        import json

        completion = self.client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        )
        raw = completion.choices.pop().message.content or "{}"
        parsed = json.loads(raw)
        return parsed.get("results", [])
```

- [ ] **Step 2: Verify import**

```bash
cd /Users/mostofa.mohiuddin/Work/rnd/mail-sync && PYTHONPATH=. backend/.venv/bin/python -c "from backend.src.openai.openai_client import OpenAIClient; assert hasattr(OpenAIClient, 'detect_important_batch'); print('ok')"
```

Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add backend/src/openai/openai_client.py
git commit -m "feat(backend): add OpenAIClient.detect_important_batch"
```

---

### Task 1.4: Implement `ImportantMailService.classify_batch` (TDD)

**Files:**
- Create: `backend/tests/important_mail/__init__.py`
- Create: `backend/tests/important_mail/test_classify_batch.py`
- Modify: `backend/src/important_mail/service.py`

- [ ] **Step 1: Create the test package marker**

Create empty file `backend/tests/important_mail/__init__.py`.

- [ ] **Step 2: Write the failing tests**

Create `backend/tests/important_mail/test_classify_batch.py`:

```python
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
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
cd /Users/mostofa.mohiuddin/Work/rnd/mail-sync && PYTHONPATH=. backend/.venv/bin/pytest backend/tests/important_mail/test_classify_batch.py -v
```

Expected: All 9 tests FAIL with `AttributeError: 'ImportantMailService' object has no attribute 'classify_batch'`.

- [ ] **Step 4: Implement `classify_batch`**

Replace the entire contents of `backend/src/important_mail/service.py` with:

```python
from datetime import datetime, timezone

from fastapi import Depends

from backend.src.important_mail.dtos import (
    ClassifyBatchRequest,
    ClassifyBatchResponse,
    ClassifyBatchResultRow,
    MailMetaDataInput,
)
from backend.src.important_mail.models import (
    ImportantMailClassification,
    ImportantMailNotification,
)
from backend.src.important_mail.repositories import (
    ImportantMailClassificationRepository,
    ImportantMailNotificationRepository,
)
from backend.src.link_mail_address.service import LinkMailAddressService
from backend.src.openai.openai_client import OpenAIClient

from dateutil.parser import parse


KNOWN_BULK_SENDERS = {
    "mailchimp.com",
    "sendgrid.net",
    "mailgun.org",
    "notifications.github.com",
    "e.linkedin.com",
    "email.medium.com",
}

NOREPLY_PREFIXES = (
    "noreply",
    "no-reply",
    "donotreply",
    "do-not-reply",
    "notifications",
    "notification",
)


def _prefilter(mail: MailMetaDataInput) -> tuple[bool | None, str | None]:
    """Return (is_important, reason) if pre-filter applies, else (None, None)."""
    sender = (mail.sender.email or "").lower()
    receiver = (mail.receiver.email or "").lower()

    if sender and sender == receiver:
        return False, "self_sender"

    local, _, domain = sender.partition("@")
    if local.startswith(NOREPLY_PREFIXES):
        return False, "noreply_local_part"
    if domain in KNOWN_BULK_SENDERS:
        return False, "known_bulk_sender"

    return None, None


class ImportantMailService:
    def __init__(
        self,
        openai_client: OpenAIClient = Depends(),
        important_mail_notification_repository: ImportantMailNotificationRepository = Depends(),
        important_mail_classification_repository: ImportantMailClassificationRepository = Depends(),
        link_mail_address_service: LinkMailAddressService = Depends(),
    ):
        self.important_mail_notification_repository = important_mail_notification_repository
        self.important_mail_classification_repository = important_mail_classification_repository
        self.openai_client = openai_client
        self.link_mail_address_service = link_mail_address_service

    def _contains_affirmative(self, text):
        affirmatives = ["true", "1", "t", "y", "yes", "yeah", "yup", "certainly", "uh-huh"]
        text_lower = text.lower()
        for affirmative in affirmatives:
            if affirmative in text_lower:
                return True
        return False

    def detect_important(self, subject: str, sender: str, snippet: str) -> bool:
        data = self.openai_client.detect_important_email(subject, sender, snippet)
        return self._contains_affirmative(data) if data else False

    async def classify_batch(self, request: ClassifyBatchRequest) -> ClassifyBatchResponse:
        if not request.mails:
            return ClassifyBatchResponse(results=[])

        results_by_id: dict[str, ClassifyBatchResultRow] = {}
        unresolved: list[MailMetaDataInput] = []

        # 1. pre-filter
        for mail in request.mails:
            decision, reason = _prefilter(mail)
            if decision is not None:
                results_by_id[mail.id] = ClassifyBatchResultRow(
                    mail_id=mail.id, is_important=decision, reason=reason
                )
            else:
                unresolved.append(mail)

        # 2. cache lookup
        if unresolved:
            cache = await self.important_mail_classification_repository.get_by_mail_ids(
                [m.id for m in unresolved]
            )
            still_unresolved: list[MailMetaDataInput] = []
            for mail in unresolved:
                if mail.id in cache:
                    results_by_id[mail.id] = ClassifyBatchResultRow(
                        mail_id=mail.id, is_important=cache[mail.id], reason="cached"
                    )
                else:
                    still_unresolved.append(mail)
            unresolved = still_unresolved

        # 3. batched OpenAI call
        if unresolved:
            batch_input = [
                {
                    "id": m.id,
                    "subject": m.subject,
                    "sender_email": m.sender.email,
                    "snippet": m.snippet,
                }
                for m in unresolved
            ]
            llm_results = self.openai_client.detect_important_batch(batch_input)
            llm_by_id = {r.get("id"): r for r in llm_results}
            for mail in unresolved:
                row = llm_by_id.get(mail.id, {"important": False, "reason": "llm_no_response"})
                results_by_id[mail.id] = ClassifyBatchResultRow(
                    mail_id=mail.id,
                    is_important=bool(row.get("important", False)),
                    reason=row.get("reason"),
                )

        # 4. persist all decisions to cache
        now = datetime.now(timezone.utc).isoformat()
        await self.important_mail_classification_repository.upsert_many(
            [
                ImportantMailClassification(
                    mail_id=row.mail_id,
                    is_important=row.is_important,
                    reason=row.reason,
                    classified_at=now,
                )
                for row in results_by_id.values()
            ]
        )

        # 5. return in input order
        return ClassifyBatchResponse(
            results=[results_by_id[m.id] for m in request.mails]
        )

    async def create_important_mail_notification(self, notifications: list[ImportantMailNotification]):
        return await self.important_mail_notification_repository.add_notifications(notifications)

    async def get_important_mail_notifications(self, username: str) -> list[ImportantMailNotification]:
        link_mail_addresses = await self.link_mail_address_service.get_all_linked_mail_address(username)
        data = await self.important_mail_notification_repository.get_notifications(
            [link_address.id for link_address in link_mail_addresses]
        )
        notifications = [ImportantMailNotification(**d) for d in data]
        notifications.sort(key=lambda x: parse(x.mail_metadata.date), reverse=True)
        return notifications

    async def mark_important_mail_notification_as_read(self, notification_ids: list[str]) -> None:
        await self.important_mail_notification_repository.mark_notification_as_read(notification_ids)
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd /Users/mostofa.mohiuddin/Work/rnd/mail-sync && PYTHONPATH=. backend/.venv/bin/pytest backend/tests/important_mail/test_classify_batch.py -v
```

Expected: All 9 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src/important_mail/service.py backend/tests/important_mail/__init__.py backend/tests/important_mail/test_classify_batch.py
git commit -m "feat(backend): implement ImportantMailService.classify_batch with pre-filter, cache, and batched LLM call"
```

---

### Task 1.5: Wire up the `POST /classify-batch` route

**Files:**
- Modify: `backend/src/important_mail/routes.py`

- [ ] **Step 1: Add the route**

Replace the entire contents of `backend/src/important_mail/routes.py` with:

```python
from typing import Annotated
from bson import ObjectId
from fastapi import APIRouter, Depends, Security
from fastapi_jwt import JwtAuthorizationCredentials

from backend.src.authentication.service import ApiKeyBasedAuthentication, access_security
from backend.src.common.models import ObjectIdPydanticAnnotation
from backend.src.important_mail.dtos import (
    ClassifyBatchRequest,
    ClassifyBatchResponse,
    ImportantMailDetectRequest,
    ImportantMailNotificationRequest,
)
from backend.src.important_mail.models import ImportantMailNotification
from backend.src.important_mail.service import ImportantMailService

router = APIRouter(
    prefix="/api/important-mail",
    tags=["Important Mail"],
)


@router.post("/detect", status_code=200)
async def detect_important_mail(
    request_body: ImportantMailDetectRequest,
    import_mail_service: ImportantMailService = Depends(),
) -> dict[str, bool]:
    is_important = import_mail_service.detect_important(request_body.subject, request_body.sender, request_body.snippet)
    return {"is_important": is_important}


@router.post("/classify-batch", status_code=200)
async def classify_batch(
    request_body: ClassifyBatchRequest,
    import_mail_service: ImportantMailService = Depends(),
    _=Depends(ApiKeyBasedAuthentication()),
) -> ClassifyBatchResponse:
    return await import_mail_service.classify_batch(request_body)


@router.post("/notifications", status_code=200)
async def create_important_mail_notification(
    request_body: ImportantMailNotificationRequest,
    import_mail_service: ImportantMailService = Depends(),
    _=Depends(ApiKeyBasedAuthentication()),
):
    return await import_mail_service.create_important_mail_notification(request_body.notifications)


@router.get("/notifications", status_code=200)
async def get_important_mail_notifications(
    import_mail_service: ImportantMailService = Depends(),
    jwt_credentials: JwtAuthorizationCredentials = Security(access_security),
) -> list[ImportantMailNotification]:
    return await import_mail_service.get_important_mail_notifications(jwt_credentials.subject.get("username"))


@router.put("/notifications/read", status_code=200)
async def mark_important_mail_notification_as_read(
    notification_ids: list[Annotated[ObjectId, ObjectIdPydanticAnnotation]],
    import_mail_service: ImportantMailService = Depends(),
    _: JwtAuthorizationCredentials = Security(access_security),
) -> None:
    await import_mail_service.mark_important_mail_notification_as_read(notification_ids)
```

Note: this also adds `ApiKeyBasedAuthentication` to `POST /notifications` (it was previously unauthenticated, which is a separate latent issue — fixing in passing because the worker already passes the key).

- [ ] **Step 2: Smoke-test that the app boots**

```bash
cd /Users/mostofa.mohiuddin/Work/rnd/mail-sync && PYTHONPATH=. backend/.venv/bin/python -c "import importlib; m = importlib.import_module('backend.main'); print(sorted([r.path for r in m.app.routes if 'classify' in r.path]))"
```

Expected: `['/api/important-mail/classify-batch']`

- [ ] **Step 3: Commit**

```bash
git add backend/src/important_mail/routes.py
git commit -m "feat(backend): expose POST /important-mail/classify-batch (api-key auth)"
```

---

## Phase 2 — Backend: Redis publish on notification create

This phase is independently shippable. No subscribers exist yet; publishes are no-ops.

### Task 2.1: Add `pubsub` helper module

**Files:**
- Create: `backend/src/common/pubsub.py`

- [ ] **Step 1: Create the helper**

Create `backend/src/common/pubsub.py`:

```python
from typing import Annotated, AsyncIterator

from aioredis import Redis
from fastapi import Depends

from backend.src.common.database.connection import get_redis_session
from backend.src.logger import LOGGER


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
```

- [ ] **Step 2: Verify import**

```bash
cd /Users/mostofa.mohiuddin/Work/rnd/mail-sync && PYTHONPATH=. backend/.venv/bin/python -c "from backend.src.common.pubsub import PubSubService; print('ok')"
```

Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add backend/src/common/pubsub.py
git commit -m "feat(backend): add common.pubsub helper around aioredis"
```

---

### Task 2.2: Modify `create_important_mail_notification` to publish (TDD)

**Files:**
- Create: `backend/tests/important_mail/test_create_notifications_publish.py`
- Modify: `backend/src/important_mail/service.py`
- Modify: `backend/src/important_mail/repositories.py`
- Modify: `backend/src/link_mail_address/repositories.py` (add `get_by_ids` helper)

- [ ] **Step 1: Write the failing test**

Create `backend/tests/important_mail/test_create_notifications_publish.py`:

```python
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/mostofa.mohiuddin/Work/rnd/mail-sync && PYTHONPATH=. backend/.venv/bin/pytest backend/tests/important_mail/test_create_notifications_publish.py -v
```

Expected: tests fail with either `AttributeError: ... no attribute 'pubsub'` or because the service constructor still uses the old signature.

- [ ] **Step 3: Add `LinkMailAddressRepository.get_usernames_by_ids`**

Append to `backend/src/link_mail_address/repositories.py` (inside the `LinkMailAddressRepository` class):

```python
    async def get_usernames_by_ids(self, ids: list[ObjectId]) -> dict[ObjectId, str]:
        if not ids:
            return {}
        cursor = self.collection.find({"_id": {"$in": ids}}, {"_id": 1, "username": 1})
        out: dict[ObjectId, str] = {}
        async for doc in cursor:
            out[doc["_id"]] = doc["username"]
        return out
```

- [ ] **Step 4: Add `LinkMailAddressService.get_usernames_by_ids` passthrough**

Append to `backend/src/link_mail_address/service.py` (inside `LinkMailAddressService`):

```python
    async def get_usernames_by_ids(self, ids: list) -> dict:
        return await self.link_mail_address_repository.get_usernames_by_ids(ids)
```

- [ ] **Step 5: Modify `ImportantMailService.create_important_mail_notification`**

In `backend/src/important_mail/service.py`:

a. Add to imports at the top:

```python
import json
from collections import defaultdict

from backend.src.common.pubsub import PubSubService
```

b. Add `pubsub` to the `__init__` signature and store it:

```python
    def __init__(
        self,
        openai_client: OpenAIClient = Depends(),
        important_mail_notification_repository: ImportantMailNotificationRepository = Depends(),
        important_mail_classification_repository: ImportantMailClassificationRepository = Depends(),
        link_mail_address_service: LinkMailAddressService = Depends(),
        pubsub: PubSubService = Depends(),
    ):
        self.important_mail_notification_repository = important_mail_notification_repository
        self.important_mail_classification_repository = important_mail_classification_repository
        self.openai_client = openai_client
        self.link_mail_address_service = link_mail_address_service
        self.pubsub = pubsub
```

c. Replace the body of `create_important_mail_notification`:

```python
    async def create_important_mail_notification(self, notifications: list[ImportantMailNotification]):
        if not notifications:
            return []

        inserted = await self.important_mail_notification_repository.add_notifications(notifications)

        addr_ids = list({n.linked_mail_address_id for n in inserted})
        username_by_addr = await self.link_mail_address_service.get_usernames_by_ids(addr_ids)

        grouped: dict[str, list[ImportantMailNotification]] = defaultdict(list)
        for n in inserted:
            username = username_by_addr.get(n.linked_mail_address_id)
            if username:
                grouped[username].append(n)

        for username, items in grouped.items():
            payload = json.dumps(
                {
                    "type": "new_important_mail",
                    "notifications": [json.loads(item.json()) for item in items],
                }
            )
            await self.pubsub.publish(f"notif:{username}", payload)

        return inserted
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd /Users/mostofa.mohiuddin/Work/rnd/mail-sync && PYTHONPATH=. backend/.venv/bin/pytest backend/tests/important_mail/ -v
```

Expected: all 12 tests in `test_classify_batch.py` and `test_create_notifications_publish.py` PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/src/important_mail/service.py backend/src/link_mail_address/repositories.py backend/src/link_mail_address/service.py backend/tests/important_mail/test_create_notifications_publish.py
git commit -m "feat(backend): publish notif:<username> on important-mail notification insert"
```

---

## Phase 3 — Backend: SSE stream endpoint + nginx

### Task 3.1: Create `notifications` module skeleton

**Files:**
- Create: `backend/src/notifications/__init__.py`
- Create: `backend/src/notifications/service.py`
- Create: `backend/src/notifications/routes.py`

- [ ] **Step 1: Create the package marker**

Create empty file `backend/src/notifications/__init__.py`.

- [ ] **Step 2: Create the service**

Create `backend/src/notifications/service.py`:

```python
import asyncio
import secrets
import time
from typing import Annotated, AsyncIterator

from aioredis import Redis
from fastapi import Depends, HTTPException, status

from backend.src.common.database.connection import get_redis_session
from backend.src.common.pubsub import PubSubService
from backend.src.logger import LOGGER

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
```

- [ ] **Step 3: Create the routes**

Create `backend/src/notifications/routes.py`:

```python
from fastapi import APIRouter, Depends, Query, Request, Security, status
from fastapi.responses import StreamingResponse
from fastapi_jwt import JwtAuthorizationCredentials

from backend.src.authentication.service import access_security
from backend.src.notifications.service import NotificationStreamService

router = APIRouter(
    prefix="/api/notifications",
    tags=["Notifications"],
)


@router.post("/stream/ticket", status_code=status.HTTP_200_OK)
async def issue_stream_ticket(
    service: NotificationStreamService = Depends(),
    jwt_credentials: JwtAuthorizationCredentials = Security(access_security),
) -> dict:
    return await service.issue_ticket(jwt_credentials.subject.get("username"))


@router.get("/stream")
async def stream(
    request: Request,
    ticket: str = Query(...),
    service: NotificationStreamService = Depends(),
):
    username = await service.consume_ticket(ticket)
    return StreamingResponse(
        service.event_generator(request, username),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
```

- [ ] **Step 4: Verify imports**

```bash
cd /Users/mostofa.mohiuddin/Work/rnd/mail-sync && PYTHONPATH=. backend/.venv/bin/python -c "from backend.src.notifications.routes import router; print(sorted(r.path for r in router.routes))"
```

Expected: `['/api/notifications/stream', '/api/notifications/stream/ticket']`

- [ ] **Step 5: Commit**

```bash
git add backend/src/notifications/
git commit -m "feat(backend): add notifications module with SSE stream + ticket endpoint"
```

---

### Task 3.2: Tests for SSE stream

**Files:**
- Create: `backend/tests/notifications/__init__.py`
- Create: `backend/tests/notifications/test_stream.py`

- [ ] **Step 1: Create the test package marker**

Create empty file `backend/tests/notifications/__init__.py`.

- [ ] **Step 2: Write the tests**

Create `backend/tests/notifications/test_stream.py`:

```python
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
```

- [ ] **Step 3: Run tests to verify they pass**

```bash
cd /Users/mostofa.mohiuddin/Work/rnd/mail-sync && PYTHONPATH=. backend/.venv/bin/pytest backend/tests/notifications/ -v
```

Expected: all 4 tests PASS.

- [ ] **Step 4: Commit**

```bash
git add backend/tests/notifications/
git commit -m "test(backend): cover ticket exchange + SSE event generator"
```

---

### Task 3.3: Wire router; delete `web_socket` and `mail_notification` modules

**Files:**
- Modify: `backend/main.py`
- Delete: `backend/src/web_socket/` (entire directory)
- Delete: `backend/src/mail_notification/` (entire directory)

- [ ] **Step 1: Modify `backend/main.py`**

Replace the lines (around lines 8–19):

```python
from src.web_socket.routes import router as web_socket_router
from src.important_mail.routes import router as important_mail_router
```

with:

```python
from src.important_mail.routes import router as important_mail_router
from src.notifications.routes import router as notifications_router
```

And in `init_routers`, replace:

```python
    fastapi_app.include_router(web_socket_router)
    fastapi_app.include_router(important_mail_router)
```

with:

```python
    fastapi_app.include_router(important_mail_router)
    fastapi_app.include_router(notifications_router)
```

- [ ] **Step 2: Delete the dead modules**

```bash
rm -rf backend/src/web_socket backend/src/mail_notification
```

- [ ] **Step 3: Verify the app boots and the new routes are registered**

```bash
cd /Users/mostofa.mohiuddin/Work/rnd/mail-sync && PYTHONPATH=. backend/.venv/bin/python -c "import importlib; m = importlib.import_module('backend.main'); paths = sorted([r.path for r in m.app.routes]); assert '/api/notifications/stream' in paths and '/api/notifications/stream/ticket' in paths and '/ws/user/{username}' not in paths; print('ok')"
```

Expected: `ok`

- [ ] **Step 4: Run all backend tests to confirm no regressions**

```bash
cd /Users/mostofa.mohiuddin/Work/rnd/mail-sync && PYTHONPATH=. backend/.venv/bin/pytest backend/tests -v
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/main.py backend/src/web_socket backend/src/mail_notification
git commit -m "feat(backend): wire notifications router; delete unused web_socket and mail_notification modules"
```

---

### Task 3.4: Update nginx for SSE

**Files:**
- Modify: `nginx/nginx.conf`

- [ ] **Step 1: Insert the SSE-specific location block**

In `nginx/nginx.conf`, replace the existing `/api/` block (lines 32–38):

```
        location /api/ {
            proxy_pass http://api:7900/api/;
            proxy_set_header Host              $host;
            proxy_set_header X-Real-IP         $remote_addr;
            proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
        }
```

with:

```
        location /api/notifications/stream {
            proxy_pass http://api:7900/api/notifications/stream;
            proxy_http_version 1.1;
            proxy_buffering off;
            proxy_cache off;
            proxy_read_timeout 1h;
            proxy_set_header Connection        '';
            proxy_set_header Host              $host;
            proxy_set_header X-Real-IP         $remote_addr;
            proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
        }

        location /api/ {
            proxy_pass http://api:7900/api/;
            proxy_set_header Host              $host;
            proxy_set_header X-Real-IP         $remote_addr;
            proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
        }
```

Order matters: more-specific location first.

- [ ] **Step 2: Validate nginx config syntax inside the running container (if dev stack is up)**

```bash
docker compose -f docker-compose.https.yml exec nginx nginx -t 2>&1 || echo "skip if stack not running"
```

Expected: either `nginx: configuration file ... test is successful` or the skip message.

- [ ] **Step 3: Commit**

```bash
git add nginx/nginx.conf
git commit -m "chore(nginx): disable buffering on /api/notifications/stream for SSE"
```

---

## Phase 4 — Worker rewrite

### Task 4.1: Add Redis client + UUID dependencies and config

**Files:**
- Modify: `worker/go.mod`
- Modify: `worker/internal/config/config.go`
- Create: `worker/internal/redis/client.go`

- [ ] **Step 1: Add deps**

```bash
cd /Users/mostofa.mohiuddin/Work/rnd/mail-sync/worker && go get github.com/redis/go-redis/v9@v9.5.1 && go get github.com/google/uuid@v1.6.0 && go mod tidy
```

Expected: `go.mod` and `go.sum` updated; no errors.

- [ ] **Step 2: Add `RedisURL` to config**

Replace the contents of `worker/internal/config/config.go`:

```go
package config

import (
	"os"

	"github.com/joho/godotenv"
)

// Config holds the application configuration
type Config struct {
	MongoDBURI     string
	MailSyncApiUrl string
	ApiKey         string
	RedisURL       string
}

// New returns a new Config instance
func New() *Config {
	// Load environment variables from .env file
	if err := godotenv.Load(); err != nil {
		// .env is optional in container envs
	}

	return &Config{
		MongoDBURI:     getEnv("MONGODB_URI", "mongodb://admin:password@localhost:27017"),
		MailSyncApiUrl: getEnv("MAIL_SYNC_API_URL", "http://localhost:7900/api"),
		ApiKey:         getEnv("API_KEY", "557573f1-471a-4de0-99f1-626cb4848e11"),
		RedisURL:       getEnv("REDIS_URL", "redis://redis:6379/0"),
	}
}

// getEnv retrieves the value of an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
```

(Note: also drops the `panic` on missing `.env` — was previously fatal for container runs without one.)

- [ ] **Step 3: Create the redis client singleton**

Create `worker/internal/redis/client.go`:

```go
package redis

import (
	"context"
	"sync"

	"github.com/MostofaMohiuddin/mail-sync/internal/config"
	goredis "github.com/redis/go-redis/v9"
)

var (
	once   sync.Once
	client *goredis.Client
)

// Client returns a process-wide singleton redis client.
func Client() *goredis.Client {
	once.Do(func() {
		opt, err := goredis.ParseURL(config.New().RedisURL)
		if err != nil {
			panic(err)
		}
		client = goredis.NewClient(opt)
		// Eager ping so misconfiguration is loud at startup.
		if err := client.Ping(context.Background()).Err(); err != nil {
			panic(err)
		}
	})
	return client
}
```

- [ ] **Step 4: Verify it compiles**

```bash
cd /Users/mostofa.mohiuddin/Work/rnd/mail-sync/worker && go build ./...
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add worker/go.mod worker/go.sum worker/internal/config/config.go worker/internal/redis/client.go
git commit -m "feat(worker): add go-redis dependency and singleton client"
```

---

### Task 4.2: Per-address Redis lock

**Files:**
- Create: `worker/internal/lock/redis_lock.go`
- Create: `worker/internal/lock/redis_lock_test.go`

- [ ] **Step 1: Write the failing test**

Create `worker/internal/lock/redis_lock_test.go`:

```go
package lock

import (
	"context"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	goredis "github.com/redis/go-redis/v9"
)

func newTestClient(t *testing.T) *goredis.Client {
	t.Helper()
	mr, err := miniredis.Run()
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(mr.Close)
	return goredis.NewClient(&goredis.Options{Addr: mr.Addr()})
}

func TestAcquireAndRelease(t *testing.T) {
	c := newTestClient(t)
	l := New(c)

	token, ok, err := l.Acquire(context.Background(), "k", time.Minute)
	if err != nil || !ok || token == "" {
		t.Fatalf("acquire 1: token=%q ok=%v err=%v", token, ok, err)
	}

	_, ok, err = l.Acquire(context.Background(), "k", time.Minute)
	if err != nil {
		t.Fatalf("acquire 2 err: %v", err)
	}
	if ok {
		t.Fatal("acquire 2 should have failed (still locked)")
	}

	if err := l.Release(context.Background(), "k", token); err != nil {
		t.Fatalf("release: %v", err)
	}

	_, ok, err = l.Acquire(context.Background(), "k", time.Minute)
	if err != nil || !ok {
		t.Fatalf("acquire 3: ok=%v err=%v", ok, err)
	}
}

func TestReleaseWithMismatchedTokenIsNoOp(t *testing.T) {
	c := newTestClient(t)
	l := New(c)

	tok, _, _ := l.Acquire(context.Background(), "k", time.Minute)
	// Stranger tries to release with the wrong token.
	if err := l.Release(context.Background(), "k", "wrong"); err != nil {
		t.Fatalf("release with wrong token: %v", err)
	}

	// Original holder still cannot re-acquire because their lock is intact.
	_, ok, _ := l.Acquire(context.Background(), "k", time.Minute)
	if ok {
		t.Fatal("expected lock to still be held by original token")
	}
	_ = tok
}
```

- [ ] **Step 2: Add miniredis dependency**

```bash
cd /Users/mostofa.mohiuddin/Work/rnd/mail-sync/worker && go get github.com/alicebob/miniredis/v2@v2.32.1 && go mod tidy
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd /Users/mostofa.mohiuddin/Work/rnd/mail-sync/worker && go test ./internal/lock/...
```

Expected: build failure — `lock` package does not exist yet.

- [ ] **Step 4: Implement the lock**

Create `worker/internal/lock/redis_lock.go`:

```go
package lock

import (
	"context"
	"time"

	"github.com/google/uuid"
	goredis "github.com/redis/go-redis/v9"
)

const releaseScript = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
	return redis.call("DEL", KEYS[1])
else
	return 0
end
`

type Lock struct {
	c *goredis.Client
}

func New(c *goredis.Client) *Lock {
	return &Lock{c: c}
}

// Acquire tries to set key with a unique token. If the key already exists, returns ok=false.
// On success, the caller MUST call Release with the returned token to free it early; otherwise
// the TTL will expire it.
func (l *Lock) Acquire(ctx context.Context, key string, ttl time.Duration) (string, bool, error) {
	token := uuid.NewString()
	ok, err := l.c.SetNX(ctx, key, token, ttl).Result()
	if err != nil {
		return "", false, err
	}
	if !ok {
		return "", false, nil
	}
	return token, true, nil
}

// Release deletes the key only if the stored value matches the provided token.
// Mismatched tokens are silent no-ops, which prevents a slow tick from releasing
// a lock the next tick now owns.
func (l *Lock) Release(ctx context.Context, key, token string) error {
	return l.c.Eval(ctx, releaseScript, []string{key}, token).Err()
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd /Users/mostofa.mohiuddin/Work/rnd/mail-sync/worker && go test ./internal/lock/... -v
```

Expected: 2 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add worker/internal/lock/ worker/go.mod worker/go.sum
git commit -m "feat(worker): per-key Redis lock with Lua-based safe release"
```

---

### Task 4.3: Generic worker pool

**Files:**
- Create: `worker/internal/pool/pool.go`
- Create: `worker/internal/pool/pool_test.go`

- [ ] **Step 1: Write the failing test**

Create `worker/internal/pool/pool_test.go`:

```go
package pool

import (
	"sync/atomic"
	"testing"
)

func TestPoolProcessesEveryItem(t *testing.T) {
	var processed int64
	items := make([]int, 100)
	for i := range items {
		items[i] = i
	}

	Run(8, items, func(_ int) {
		atomic.AddInt64(&processed, 1)
	})

	if processed != 100 {
		t.Fatalf("processed = %d, want 100", processed)
	}
}

func TestPoolRespectsConcurrency(t *testing.T) {
	var inFlight, peak int64
	items := make([]int, 50)

	Run(4, items, func(_ int) {
		cur := atomic.AddInt64(&inFlight, 1)
		for {
			old := atomic.LoadInt64(&peak)
			if cur <= old || atomic.CompareAndSwapInt64(&peak, old, cur) {
				break
			}
		}
		atomic.AddInt64(&inFlight, -1)
	})

	if peak > 4 {
		t.Fatalf("peak in-flight = %d, want <= 4", peak)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/mostofa.mohiuddin/Work/rnd/mail-sync/worker && go test ./internal/pool/...
```

Expected: build failure — `pool` package does not exist.

- [ ] **Step 3: Implement the pool**

Create `worker/internal/pool/pool.go`:

```go
package pool

import "sync"

// Run dispatches items to `concurrency` worker goroutines that each call fn.
// Returns once every item has been processed.
func Run[T any](concurrency int, items []T, fn func(T)) {
	if concurrency < 1 {
		concurrency = 1
	}
	ch := make(chan T)
	var wg sync.WaitGroup
	wg.Add(concurrency)
	for i := 0; i < concurrency; i++ {
		go func() {
			defer wg.Done()
			for item := range ch {
				fn(item)
			}
		}()
	}
	for _, item := range items {
		ch <- item
	}
	close(ch)
	wg.Wait()
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/mostofa.mohiuddin/Work/rnd/mail-sync/worker && go test ./internal/pool/... -v
```

Expected: 2 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add worker/internal/pool/
git commit -m "feat(worker): generic concurrent worker pool helper"
```

---

### Task 4.4: Worker `mailsync.ClassifyBatch` API call + safer error handling

**Files:**
- Modify: `worker/internal/mailsync/types.go`
- Modify: `worker/internal/mailsync/service.go`

- [ ] **Step 1: Add the request/response types**

Append to `worker/internal/mailsync/types.go`:

```go

type ClassifyBatchRequest struct {
	Mails []MailMetaData `json:"mails"`
}

type ClassifyBatchResultRow struct {
	MailID      string `json:"mail_id"`
	IsImportant bool   `json:"is_important"`
}

type ClassifyBatchResponse struct {
	Results []ClassifyBatchResultRow `json:"results"`
}
```

- [ ] **Step 2: Replace `mailsync/service.go` with safer implementations**

Replace the entire contents of `worker/internal/mailsync/service.go` with:

```go
package mailsync

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"

	"github.com/MostofaMohiuddin/mail-sync/internal/config"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// callAPI makes an HTTP request to the backend with API-key auth.
// Always returns a non-nil error on transport failure.
func callAPI(endPoint string, method string, body interface{}) (*http.Response, error) {
	cfg := config.New()
	url := cfg.MailSyncApiUrl + endPoint

	var reader io.Reader
	if body != nil {
		jsonData, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		reader = bytes.NewReader(jsonData)
	}

	req, err := http.NewRequest(method, url, reader)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", cfg.ApiKey)

	client := &http.Client{}
	return client.Do(req)
}

func SendScheduledMails(IDs []primitive.ObjectID) {
	body := SendScheduledMailIdsBody{ScheduledMailIds: IDs}
	resp, err := callAPI("/schedule-mail/send", http.MethodPost, body)
	if err != nil {
		log.Printf("SendScheduledMails: transport error: %v", err)
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode == 200 {
		log.Println("Scheduled Mail sent successfully")
	} else {
		log.Printf("SendScheduledMails: unexpected status %d", resp.StatusCode)
	}
}

func ReadMailByLinkedMailAddressId(linkedMailAddressId primitive.ObjectID) ReadMailApiResponse {
	resp, err := callAPI(
		fmt.Sprintf("/mails/link-mail-address/%s/mails?number_of_mails=1", linkedMailAddressId.Hex()),
		http.MethodGet, nil,
	)
	if err != nil {
		log.Printf("ReadMailByLinkedMailAddressId(%s): transport error: %v", linkedMailAddressId.Hex(), err)
		return ReadMailApiResponse{Mails: []MailMetaData{}}
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		log.Printf("ReadMailByLinkedMailAddressId(%s): unexpected status %d", linkedMailAddressId.Hex(), resp.StatusCode)
		return ReadMailApiResponse{Mails: []MailMetaData{}}
	}
	var result ReadMailApiResponse
	bodyBytes, _ := io.ReadAll(resp.Body)
	if err := json.Unmarshal(bodyBytes, &result); err != nil {
		log.Printf("ReadMailByLinkedMailAddressId(%s): unmarshal failed: %v", linkedMailAddressId.Hex(), err)
		return ReadMailApiResponse{Mails: []MailMetaData{}}
	}
	return result
}

func UpdateLinkedMailAddress(LastMailId string, LastMailHistoryId string, LinkedMailAddressId primitive.ObjectID) error {
	body := UpdateLinkedMailAddressBody{
		LastMailId:        LastMailId,
		LastMailHistoryId: LastMailHistoryId,
	}
	resp, err := callAPI(fmt.Sprintf("/link-mail-address/%s", LinkedMailAddressId.Hex()), http.MethodPut, body)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return fmt.Errorf("UpdateLinkedMailAddress: status %d", resp.StatusCode)
	}
	log.Printf("Updated LastMailId %s and LastMailHistory %s for LinkedMailAddressId %s",
		LastMailId, LastMailHistoryId, LinkedMailAddressId.Hex())
	return nil
}

func UpdateScheduleAutoReply(ScheduleAutoReplyId primitive.ObjectID, LastMailId string, LastMailHistoryId string) {
	body := UpdateScheduleAutoReplyBody{
		LastMailId:        LastMailId,
		LastMailHistoryId: LastMailHistoryId,
	}
	resp, err := callAPI(fmt.Sprintf("/schedule-auto-reply/%s", ScheduleAutoReplyId.Hex()), http.MethodPut, body)
	if err != nil {
		log.Printf("UpdateScheduleAutoReply: transport error: %v", err)
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode == 200 {
		log.Printf("Updated ScheduleAutoReplyId %s", ScheduleAutoReplyId.Hex())
	} else {
		log.Printf("UpdateScheduleAutoReply: unexpected status %d", resp.StatusCode)
	}
}

func GetHistory(MailHistoryId string, LinkMailAddressId primitive.ObjectID) GetHistoryApiResponse {
	resp, err := callAPI(
		fmt.Sprintf("/mails/link-mail-address/%s/history/%s", LinkMailAddressId.Hex(), MailHistoryId),
		http.MethodGet, nil,
	)
	if err != nil {
		log.Printf("GetHistory(%s): transport error: %v", LinkMailAddressId.Hex(), err)
		return GetHistoryApiResponse{Mails: []MailMetaData{}}
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		log.Printf("GetHistory(%s): unexpected status %d", LinkMailAddressId.Hex(), resp.StatusCode)
		return GetHistoryApiResponse{Mails: []MailMetaData{}}
	}
	var result GetHistoryApiResponse
	bodyBytes, _ := io.ReadAll(resp.Body)
	if err := json.Unmarshal(bodyBytes, &result); err != nil {
		log.Printf("GetHistory(%s): unmarshal failed: %v", LinkMailAddressId.Hex(), err)
		return GetHistoryApiResponse{Mails: []MailMetaData{}}
	}
	return result
}

func SendMail(LinkedMailAddressId primitive.ObjectID, MailData SendMailBody) {
	resp, err := callAPI(
		fmt.Sprintf("/mails/link-mail-address/%s/send", LinkedMailAddressId.Hex()),
		http.MethodPost, MailData,
	)
	if err != nil {
		log.Printf("SendMail: transport error: %v", err)
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode == 200 {
		log.Printf("Mail sent: linkedMailAddressId=%s to=%s", LinkedMailAddressId.Hex(), MailData.Receiver)
	} else {
		log.Printf("SendMail: unexpected status %d", resp.StatusCode)
	}
}

// Deprecated: use ClassifyBatch via the worker's notification cron path.
func DetectImportantMail(MailData MailMetaData) DetectImportantMailApiResponse {
	body := DetectImportantMailApiRequest{
		Subject: MailData.Subject, Snippet: MailData.Snippet, Sender: MailData.Sender.Email,
	}
	resp, err := callAPI("/important-mail/detect", http.MethodPost, body)
	if err != nil {
		return DetectImportantMailApiResponse{IsImportant: false}
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return DetectImportantMailApiResponse{IsImportant: false}
	}
	var result DetectImportantMailApiResponse
	bodyBytes, _ := io.ReadAll(resp.Body)
	if err := json.Unmarshal(bodyBytes, &result); err != nil {
		return DetectImportantMailApiResponse{IsImportant: false}
	}
	return result
}

func AddImportantMailNotification(notifications []ImportantMailNotification) error {
	if len(notifications) == 0 {
		return nil
	}
	body := ImportantMailNotificationApiRequest{Notifications: notifications}
	resp, err := callAPI("/important-mail/notifications", http.MethodPost, body)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return fmt.Errorf("AddImportantMailNotification: status %d", resp.StatusCode)
	}
	log.Printf("Important Mail Notification: added %d", len(notifications))
	return nil
}

// ClassifyBatch sends a batch of mails to the backend and returns the per-mail importance map.
func ClassifyBatch(mails []MailMetaData) (map[string]bool, error) {
	if len(mails) == 0 {
		return map[string]bool{}, nil
	}
	body := ClassifyBatchRequest{Mails: mails}
	resp, err := callAPI("/important-mail/classify-batch", http.MethodPost, body)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("ClassifyBatch: status %d", resp.StatusCode)
	}
	bodyBytes, _ := io.ReadAll(resp.Body)
	var parsed ClassifyBatchResponse
	if err := json.Unmarshal(bodyBytes, &parsed); err != nil {
		return nil, err
	}
	if len(parsed.Results) == 0 {
		return nil, errors.New("ClassifyBatch: empty results")
	}
	out := make(map[string]bool, len(parsed.Results))
	for _, r := range parsed.Results {
		out[r.MailID] = r.IsImportant
	}
	return out, nil
}
```

- [ ] **Step 3: Verify it compiles**

```bash
cd /Users/mostofa.mohiuddin/Work/rnd/mail-sync/worker && go build ./...
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add worker/internal/mailsync/
git commit -m "feat(worker): add ClassifyBatch + remove panics from mailsync calls"
```

---

### Task 4.5: Rewrite `important_mail_notification` service (TDD)

**Files:**
- Create: `worker/internal/important_mail_notification/service_test.go`
- Modify: `worker/internal/important_mail_notification/service.go`

- [ ] **Step 1: Write the failing test (regression for cumulative-slice bug)**

Create `worker/internal/important_mail_notification/service_test.go`:

```go
package important_mail_notification

import (
	"context"
	"errors"
	"sync"
	"testing"

	"github.com/MostofaMohiuddin/mail-sync/internal/linked_mail_address"
	"github.com/MostofaMohiuddin/mail-sync/internal/mailsync"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

var errBoom = errors.New("boom")

func newServiceForTest(api API, lock Locker, addrs []linked_mail_address.LinkedMailAddress) *ImportantMailNotificationService {
	return &ImportantMailNotificationService{
		api:         api,
		lock:        lock,
		listAddrs:   func() []linked_mail_address.LinkedMailAddress { return addrs },
		concurrency: 4,
	}
}

type fakeAPI struct {
	mu        sync.Mutex
	histories map[primitive.ObjectID][]mailsync.MailMetaData
	classify  map[string]bool
	notifyCalls [][]mailsync.ImportantMailNotification
	updateCalls []primitive.ObjectID
	classifyErr error
}

func (f *fakeAPI) GetHistory(_ string, addr primitive.ObjectID) mailsync.GetHistoryApiResponse {
	return mailsync.GetHistoryApiResponse{Mails: f.histories[addr]}
}

func (f *fakeAPI) ClassifyBatch(mails []mailsync.MailMetaData) (map[string]bool, error) {
	if f.classifyErr != nil {
		return nil, f.classifyErr
	}
	out := map[string]bool{}
	for _, m := range mails {
		out[m.ID] = f.classify[m.ID]
	}
	return out, nil
}

func (f *fakeAPI) AddImportantMailNotification(notifs []mailsync.ImportantMailNotification) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	cp := make([]mailsync.ImportantMailNotification, len(notifs))
	copy(cp, notifs)
	f.notifyCalls = append(f.notifyCalls, cp)
	return nil
}

func (f *fakeAPI) UpdateLinkedMailAddress(_, _ string, addr primitive.ObjectID) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.updateCalls = append(f.updateCalls, addr)
	return nil
}

type alwaysOpenLock struct{}

func (alwaysOpenLock) Acquire(_ context.Context, _ string) (string, bool, error) { return "tok", true, nil }
func (alwaysOpenLock) Release(_ context.Context, _, _ string) error              { return nil }

type neverOpenLock struct{}

func (neverOpenLock) Acquire(_ context.Context, _ string) (string, bool, error) { return "", false, nil }
func (neverOpenLock) Release(_ context.Context, _, _ string) error              { return nil }

func mail(id, addr string) mailsync.MailMetaData {
	return mailsync.MailMetaData{
		ID: id, HistoryId: "100",
		Sender:   mailsync.MailUser{Email: "alice@example.com"},
		Receiver: mailsync.MailUser{Email: "me@example.com"},
		Subject:  "s", Snippet: "x", Date: "Fri, 26 Apr 2026 10:00:00 +0000",
	}
}

func TestNoCumulativeSliceAcrossAddresses(t *testing.T) {
	a := primitive.NewObjectID()
	b := primitive.NewObjectID()
	api := &fakeAPI{
		histories: map[primitive.ObjectID][]mailsync.MailMetaData{
			a: {mail("m_a", a.Hex())},
			b: {mail("m_b", b.Hex())},
		},
		classify: map[string]bool{"m_a": true, "m_b": true},
	}

	hist := "h0"
	addrs := []linked_mail_address.LinkedMailAddress{
		{ID: a, LastMailHistoryId: &hist},
		{ID: b, LastMailHistoryId: &hist},
	}

	svc := newServiceForTest(api, alwaysOpenLock{}, addrs)
	svc.AddNotification()

	if len(api.notifyCalls) != 2 {
		t.Fatalf("expected 2 notify calls (one per address), got %d", len(api.notifyCalls))
	}
	for _, call := range api.notifyCalls {
		if len(call) != 1 {
			t.Fatalf("each call should contain exactly 1 notification, got %d", len(call))
		}
	}
}

func TestClassifyErrorSkipsAddressAndDoesNotAdvance(t *testing.T) {
	addr := primitive.NewObjectID()
	hist := "h0"
	api := &fakeAPI{
		histories:   map[primitive.ObjectID][]mailsync.MailMetaData{addr: {mail("m1", addr.Hex())}},
		classifyErr: errBoom,
	}
	svc := newServiceForTest(api, alwaysOpenLock{}, []linked_mail_address.LinkedMailAddress{{ID: addr, LastMailHistoryId: &hist}})
	svc.AddNotification()

	if len(api.updateCalls) != 0 {
		t.Fatalf("LastMailHistoryId should not advance on classify failure; got %v", api.updateCalls)
	}
	if len(api.notifyCalls) != 0 {
		t.Fatalf("no notifications should be sent on classify failure; got %v", api.notifyCalls)
	}
}

func TestNonImportantMailDoesNotProduceNotificationButStillAdvancesHistory(t *testing.T) {
	addr := primitive.NewObjectID()
	hist := "h0"
	api := &fakeAPI{
		histories: map[primitive.ObjectID][]mailsync.MailMetaData{addr: {mail("m1", addr.Hex())}},
		classify:  map[string]bool{"m1": false},
	}
	svc := newServiceForTest(api, alwaysOpenLock{}, []linked_mail_address.LinkedMailAddress{{ID: addr, LastMailHistoryId: &hist}})
	svc.AddNotification()

	if len(api.notifyCalls) != 0 {
		t.Fatalf("no important mail → no notify call; got %v", api.notifyCalls)
	}
	if len(api.updateCalls) != 1 {
		t.Fatalf("history should still advance; got %v", api.updateCalls)
	}
}

func TestAddressLockedSkipsProcessing(t *testing.T) {
	addr := primitive.NewObjectID()
	hist := "h0"
	api := &fakeAPI{
		histories: map[primitive.ObjectID][]mailsync.MailMetaData{addr: {mail("m1", addr.Hex())}},
		classify:  map[string]bool{"m1": true},
	}
	svc := newServiceForTest(api, neverOpenLock{}, []linked_mail_address.LinkedMailAddress{{ID: addr, LastMailHistoryId: &hist}})
	svc.AddNotification()

	if len(api.notifyCalls) != 0 || len(api.updateCalls) != 0 {
		t.Fatalf("locked address should be skipped entirely")
	}
}

```

The full test file is a single `package important_mail_notification` file with one `import (...)` block at the top. The `errBoom` sentinel, `newServiceForTest`, `alwaysOpenLock`, and `neverOpenLock` helpers were already declared at the top of the file (above) and do not need to be repeated.

- [ ] **Step 2: Write the failing test run**

```bash
cd /Users/mostofa.mohiuddin/Work/rnd/mail-sync/worker && go test ./internal/important_mail_notification/...
```

Expected: build failure — `API`, `Locker`, `ImportantMailNotificationService` fields don't yet match the new shape.

- [ ] **Step 3: Rewrite the service**

Replace the entire contents of `worker/internal/important_mail_notification/service.go`:

```go
package important_mail_notification

import (
	"context"
	"log"
	"time"

	"github.com/MostofaMohiuddin/mail-sync/internal/linked_mail_address"
	lockpkg "github.com/MostofaMohiuddin/mail-sync/internal/lock"
	"github.com/MostofaMohiuddin/mail-sync/internal/mailsync"
	"github.com/MostofaMohiuddin/mail-sync/internal/pool"
	redisclient "github.com/MostofaMohiuddin/mail-sync/internal/redis"

	"github.com/araddon/dateparse"
	goredis "github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

const (
	defaultConcurrency = 8
	lockTTL            = 60 * time.Second
)

// API is the subset of mailsync the service needs (for testability).
type API interface {
	GetHistory(historyID string, addr primitive.ObjectID) mailsync.GetHistoryApiResponse
	ClassifyBatch(mails []mailsync.MailMetaData) (map[string]bool, error)
	AddImportantMailNotification(notifs []mailsync.ImportantMailNotification) error
	UpdateLinkedMailAddress(lastMailID, lastHistoryID string, addr primitive.ObjectID) error
}

// Locker is the lock interface used by the service.
type Locker interface {
	Acquire(ctx context.Context, key string) (string, bool, error)
	Release(ctx context.Context, key, token string) error
}

// realAPI wraps the package-level mailsync functions.
type realAPI struct{}

func (realAPI) GetHistory(historyID string, addr primitive.ObjectID) mailsync.GetHistoryApiResponse {
	return mailsync.GetHistory(historyID, addr)
}
func (realAPI) ClassifyBatch(mails []mailsync.MailMetaData) (map[string]bool, error) {
	return mailsync.ClassifyBatch(mails)
}
func (realAPI) AddImportantMailNotification(notifs []mailsync.ImportantMailNotification) error {
	return mailsync.AddImportantMailNotification(notifs)
}
func (realAPI) UpdateLinkedMailAddress(lastMailID, lastHistoryID string, addr primitive.ObjectID) error {
	return mailsync.UpdateLinkedMailAddress(lastMailID, lastHistoryID, addr)
}

// realLock wraps lock.Lock to bind a fixed TTL.
type realLock struct{ inner *lockpkg.Lock }

func (l realLock) Acquire(ctx context.Context, key string) (string, bool, error) {
	return l.inner.Acquire(ctx, key, lockTTL)
}
func (l realLock) Release(ctx context.Context, key, token string) error {
	return l.inner.Release(ctx, key, token)
}

type ImportantMailNotificationService struct {
	api         API
	lock        Locker
	listAddrs   func() []linked_mail_address.LinkedMailAddress
	concurrency int
}

func NewImportantMailNotificationService(redis *goredis.Client) *ImportantMailNotificationService {
	if redis == nil {
		redis = redisclient.Client()
	}
	addrSvc := linked_mail_address.NewLinkedMailAddressService()
	return &ImportantMailNotificationService{
		api:         realAPI{},
		lock:        realLock{inner: lockpkg.New(redis)},
		listAddrs:   addrSvc.GetAllLinkedMailAddress,
		concurrency: defaultConcurrency,
	}
}

func (s *ImportantMailNotificationService) AddNotification() {
	addrs := s.listAddrs()
	log.Printf("ImportantMailNotification tick: %d addresses", len(addrs))
	pool.Run(s.concurrency, addrs, s.processOne)
}

func (s *ImportantMailNotificationService) processOne(addr linked_mail_address.LinkedMailAddress) {
	ctx, cancel := context.WithTimeout(context.Background(), 50*time.Second)
	defer cancel()

	key := "lock:poll:" + addr.ID.Hex()
	token, ok, err := s.lock.Acquire(ctx, key)
	if err != nil {
		log.Printf("processOne(%s): lock acquire error: %v", addr.ID.Hex(), err)
		return
	}
	if !ok {
		log.Printf("processOne(%s): skip — already locked", addr.ID.Hex())
		return
	}
	defer func() { _ = s.lock.Release(ctx, key, token) }()

	if addr.LastMailHistoryId == nil {
		log.Printf("processOne(%s): no LastMailHistoryId, bootstrapping", addr.ID.Hex())
		mailsync.ReadMailByLinkedMailAddressId(addr.ID)
		return
	}

	history := s.api.GetHistory(*addr.LastMailHistoryId, addr.ID)
	if len(history.Mails) == 0 {
		return
	}

	classified, err := s.api.ClassifyBatch(history.Mails)
	if err != nil {
		log.Printf("processOne(%s): ClassifyBatch failed: %v", addr.ID.Hex(), err)
		return
	}

	// Per-address notification slice — declared INSIDE this function so it
	// cannot leak across addresses (the historical bug).
	notifications := make([]mailsync.ImportantMailNotification, 0, len(history.Mails))
	var recent mailsync.MailMetaData
	for i, m := range history.Mails {
		if classified[m.ID] {
			notifications = append(notifications, mailsync.ImportantMailNotification{
				LinkedMailAddressId: addr.ID,
				MailMetaData:        m,
			})
		}
		if i == 0 {
			recent = m
			continue
		}
		newDate, err1 := dateparse.ParseAny(m.Date)
		curDate, err2 := dateparse.ParseAny(recent.Date)
		if err1 == nil && err2 == nil && newDate.After(curDate) {
			recent = m
		}
	}

	if len(notifications) > 0 {
		if err := s.api.AddImportantMailNotification(notifications); err != nil {
			log.Printf("processOne(%s): AddImportantMailNotification failed: %v", addr.ID.Hex(), err)
			return
		}
	}

	if recent.HistoryId != "" {
		if err := s.api.UpdateLinkedMailAddress(recent.ID, recent.HistoryId, addr.ID); err != nil {
			log.Printf("processOne(%s): UpdateLinkedMailAddress failed: %v", addr.ID.Hex(), err)
		}
	}
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/mostofa.mohiuddin/Work/rnd/mail-sync/worker && go test ./internal/important_mail_notification/... -v
```

Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add worker/internal/important_mail_notification/
git commit -m "feat(worker): rewrite important-mail polling — parallel pool, lock, batch classify, no panics, no slice leak"
```

---

### Task 4.6: Cron schedule + main.go wiring

**Files:**
- Modify: `worker/cmd/cronjob/main.go`

- [ ] **Step 1: Update the cron entry**

Replace the contents of `worker/cmd/cronjob/main.go`:

```go
package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/MostofaMohiuddin/mail-sync/internal/cron"
	"github.com/MostofaMohiuddin/mail-sync/internal/db/mongodb"
	"github.com/MostofaMohiuddin/mail-sync/internal/important_mail_notification"
	redisclient "github.com/MostofaMohiuddin/mail-sync/internal/redis"
	"github.com/MostofaMohiuddin/mail-sync/internal/scheduled_auto_replies"
	"github.com/MostofaMohiuddin/mail-sync/internal/scheduled_mails"
)

func main() {
	fmt.Println("Starting cron job...")

	mongodb.NewClient()
	redisClient := redisclient.Client()

	scheduleMailService := scheduled_mails.NewMailService()
	scheduledAutoReplyService := scheduled_auto_replies.NewScheduledAutoReplyService()
	importantMailNotificationService := important_mail_notification.NewImportantMailNotificationService(redisClient)

	jobs := []cron.Job{
		{
			Title:          "SendScheduledMail",
			CronFunction:   scheduleMailService.SendScheduledMail,
			CronExpression: "@every 1m",
		},
		{
			Title:          "ScheduledAutoReplyService",
			CronFunction:   scheduledAutoReplyService.SendScheduledReplies,
			CronExpression: "@every 1m",
		},
		{
			Title:          "AddImportantMailNotification",
			CronFunction:   importantMailNotificationService.AddNotification,
			CronExpression: "@every 30s",
		},
	}

	c := cron.NewCronJob(jobs)
	c.Start()

	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM)
	<-shutdown

	log.Println("Shutting down...")
	c.Stop()
	log.Println("Shutdown complete")
}
```

- [ ] **Step 2: Build the worker binary**

```bash
cd /Users/mostofa.mohiuddin/Work/rnd/mail-sync/worker && go build ./...
```

Expected: no errors.

- [ ] **Step 3: Run all worker tests**

```bash
cd /Users/mostofa.mohiuddin/Work/rnd/mail-sync/worker && go test ./...
```

Expected: all PASS.

- [ ] **Step 4: Commit**

```bash
git add worker/cmd/cronjob/main.go
git commit -m "feat(worker): tick at 30s and pass redis client into notification service"
```

---

## Phase 5 — Frontend SSE hook + drop polling

### Task 5.1: Add `getNotificationStreamTicket` API helper

**Files:**
- Modify: `frontend/src/api/ImportantMailNotification.ts`

- [ ] **Step 1: Add the helper**

Replace the contents of `frontend/src/api/ImportantMailNotification.ts`:

```ts
import { authorizedApiRequestWrapper2 } from '.';

const getImportantMailNotifications = () => authorizedApiRequestWrapper2('/important-mail/notifications', 'get')();
const markImportantMailNotificationAsRead = authorizedApiRequestWrapper2('/important-mail/notifications/read', 'put');
const getNotificationStreamTicket = () => authorizedApiRequestWrapper2('/notifications/stream/ticket', 'post')();

export {
  getImportantMailNotifications,
  markImportantMailNotificationAsRead,
  getNotificationStreamTicket,
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/api/ImportantMailNotification.ts
git commit -m "feat(frontend): add getNotificationStreamTicket API helper"
```

---

### Task 5.2: Create `useNotificationStream` hook

**Files:**
- Create: `frontend/src/hooks/useNotificationStream/index.ts`

- [ ] **Step 1: Implement the hook**

Create `frontend/src/hooks/useNotificationStream/index.ts`:

```ts
import { useEffect, useRef, useState } from 'react';

import { useSWRConfig } from 'swr';

import { getNotificationStreamTicket } from '../../api/ImportantMailNotification';
import type { IImportantMailNotification } from '../../common/types';

const NOTIFICATIONS_KEY = '/important-mail/notifications';
const STREAM_BASE = 'https://mailsync.com/api/notifications/stream';
const BACKOFF_INITIAL_MS = 1000;
const BACKOFF_MAX_MS = 30_000;

interface NewEventPayload {
  type: 'new_important_mail';
  notifications: IImportantMailNotification[];
}

export function useNotificationStream({ enabled }: { enabled: boolean }): { connected: boolean } {
  const { mutate } = useSWRConfig();
  const [connected, setConnected] = useState(false);

  const sourceRef = useRef<EventSource | null>(null);
  const backoffRef = useRef(BACKOFF_INITIAL_MS);
  const reconnectTimerRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    const teardown = () => {
      cancelledRef.current = true;
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (sourceRef.current) {
        sourceRef.current.close();
        sourceRef.current = null;
      }
      setConnected(false);
    };

    const open = async () => {
      if (cancelledRef.current) return;
      if (!enabled || document.visibilityState !== 'visible') return;

      let ticket: string | undefined;
      try {
        const response = await getNotificationStreamTicket();
        ticket = response?.data?.ticket;
      } catch {
        // network failure — let the visibility/onerror paths reschedule
      }
      if (!ticket || cancelledRef.current) return;

      const source = new EventSource(`${STREAM_BASE}?ticket=${encodeURIComponent(ticket)}`);
      sourceRef.current = source;

      source.addEventListener('ready', () => {
        backoffRef.current = BACKOFF_INITIAL_MS;
        setConnected(true);
      });

      source.addEventListener('new', (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data) as NewEventPayload;
          const incoming = payload.notifications ?? [];
          mutate(
            NOTIFICATIONS_KEY,
            (current: { data?: IImportantMailNotification[] } | undefined) => {
              const existing = current?.data ?? [];
              const seen = new Set(existing.map((n) => n.id));
              const merged = [
                ...incoming.filter((n) => !seen.has(n.id)),
                ...existing,
              ];
              return current ? { ...current, data: merged } : { data: merged };
            },
            { revalidate: false },
          );
          window.setTimeout(() => mutate(NOTIFICATIONS_KEY), 1000);
        } catch {
          // malformed payload — fall back to a refetch
          mutate(NOTIFICATIONS_KEY);
        }
      });

      source.onerror = () => {
        setConnected(false);
        source.close();
        sourceRef.current = null;
        if (cancelledRef.current) return;
        const delay = backoffRef.current;
        backoffRef.current = Math.min(backoffRef.current * 2, BACKOFF_MAX_MS);
        reconnectTimerRef.current = window.setTimeout(() => {
          reconnectTimerRef.current = null;
          void open();
        }, delay);
      };
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        // refetch on resume to catch anything missed
        mutate(NOTIFICATIONS_KEY);
        if (!sourceRef.current) {
          backoffRef.current = BACKOFF_INITIAL_MS;
          void open();
        }
      } else {
        if (sourceRef.current) {
          sourceRef.current.close();
          sourceRef.current = null;
          setConnected(false);
        }
        if (reconnectTimerRef.current !== null) {
          window.clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    void open();

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      teardown();
    };
  }, [enabled, mutate]);

  return { connected };
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/hooks/useNotificationStream/index.ts
git commit -m "feat(frontend): add useNotificationStream hook (SSE + reconnect + visibility)"
```

---

### Task 5.3: Wire hook into session, drop SWR `refreshInterval`

**Files:**
- Modify: `frontend/src/hooks/userSession/index.tsx`

- [ ] **Step 1: Drop the polling and mount the hook**

In `frontend/src/hooks/userSession/index.tsx`:

a. Add import (near the other hooks):

```tsx
import { useNotificationStream } from '../useNotificationStream';
```

b. Replace the SWR call (lines 56–60):

```tsx
  const { data: notificationData, isLoading: isNotificationLoading } = useSWR(
    hasAccessToken ? '/important-mail/notifications' : null,
    importantMailNotificationApi.getImportantMailNotifications,
    { refreshInterval: 10000 },
  );
```

with:

```tsx
  const { data: notificationData, isLoading: isNotificationLoading } = useSWR(
    hasAccessToken ? '/important-mail/notifications' : null,
    importantMailNotificationApi.getImportantMailNotifications,
  );

  useNotificationStream({ enabled: hasAccessToken });
```

- [ ] **Step 2: Build the frontend to confirm no TypeScript errors**

```bash
cd /Users/mostofa.mohiuddin/Work/rnd/mail-sync/frontend && npm run build 2>&1 | tail -30
```

Expected: build succeeds (warnings OK; no compile errors).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/hooks/userSession/index.tsx
git commit -m "feat(frontend): replace 10s SWR poll with SSE notification stream"
```

---

### Task 5.4: Fix `markAllAsRead` race in Header

**Files:**
- Modify: `frontend/src/components/layout/Header.tsx`

- [ ] **Step 1: Make `markAllAsRead` await both calls**

In `frontend/src/components/layout/Header.tsx`, replace `markAllAsRead` (around lines 42–47):

```tsx
  const markAllAsRead = () => {
    if (!notifications || unreadCount === 0) return;
    const ids = notifications.filter(({ status }) => status === 'unread').map(({ id }) => id);
    api.markImportantMailNotificationAsRead({ data: ids });
    mutate('/important-mail/notifications');
  };
```

with:

```tsx
  const markAllAsRead = async () => {
    if (!notifications || unreadCount === 0) return;
    const ids = notifications.filter(({ status }) => status === 'unread').map(({ id }) => id);
    await api.markImportantMailNotificationAsRead({ data: ids });
    await mutate('/important-mail/notifications');
  };
```

And update the panel-open handler to await it (around line 49–54):

```tsx
  const handleNotificationPanelOpenChange = (newOpen: boolean) => {
    if (!newOpen && unreadCount > 0) {
      markAllAsRead();
    }
    setOpenNotificationPanel(newOpen);
  };
```

becomes:

```tsx
  const handleNotificationPanelOpenChange = (newOpen: boolean) => {
    if (!newOpen && unreadCount > 0) {
      void markAllAsRead();
    }
    setOpenNotificationPanel(newOpen);
  };
```

- [ ] **Step 2: Build the frontend to verify**

```bash
cd /Users/mostofa.mohiuddin/Work/rnd/mail-sync/frontend && npm run build 2>&1 | tail -10
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/layout/Header.tsx
git commit -m "fix(frontend): await mark-as-read API before SWR mutate"
```

---

## Phase 6 — End-to-end manual verification

This phase has no checkbox steps that mutate code; it is a recipe for verifying everything works together.

### Task 6.1: Manual smoke test

- [ ] **Step 1: Bring the dev stack up**

```bash
cd /Users/mostofa.mohiuddin/Work/rnd/mail-sync && docker compose -f docker-compose.dev.yml up --build -d api worker app redis mongodb
```

Watch for the worker line: `Adding job AddImportantMailNotification with schedule @every 30s`.

- [ ] **Step 2: Verify SSE end-to-end with curl**

In one terminal:

```bash
# Acquire a JWT (use an existing test account):
TOKEN=$(curl -sk -X POST https://mailsync.com/api/auth/sign-in -H 'Content-Type: application/json' -d '{"username":"<your-test-user>","password":"<pw>"}' | jq -r .access_token)
TICKET=$(curl -sk -X POST https://mailsync.com/api/notifications/stream/ticket -H "Authorization: Bearer $TOKEN" | jq -r .ticket)
curl -Nks "https://mailsync.com/api/notifications/stream?ticket=$TICKET"
```

Expected output within 1s: `event: ready\ndata: {}` then a `: ping` heartbeat every ~25s.

In another terminal, publish a fake notification directly:

```bash
docker compose -f docker-compose.dev.yml exec redis redis-cli PUBLISH notif:<your-test-user> '{"type":"new_important_mail","notifications":[{"id":"x","linked_mail_address_id":"x","mail_metadata":{"id":"x","history_id":"1","subject":"hi","snippet":"s","sender":{"email":"a@b","name":""},"receiver":{"email":"c@d","name":""},"date":"Fri, 26 Apr 2026 10:00:00 +0000"},"status":"unread"}]}'
```

The first terminal should immediately print:

```
event: new
data: {"type":"new_important_mail",...}
```

- [ ] **Step 3: Verify the UI**

Open `https://mailsync.com` in the browser, sign in, then run the same Redis publish command. The bell badge in the header should increment within ~1s and the notification should appear in the popover.

- [ ] **Step 4: Verify the worker tick**

Tail worker logs:

```bash
docker compose -f docker-compose.dev.yml logs -f worker | grep -E "ImportantMailNotification|processOne"
```

Expected: a tick line every 30s; per-address `processOne` lines with no panics.

If a Gmail account is linked and a fresh mail arrives, expect one `ClassifyBatch` call per address per tick instead of many `DetectImportantMail` calls.

- [ ] **Step 5: Run the full backend test suite one more time**

```bash
cd /Users/mostofa.mohiuddin/Work/rnd/mail-sync && PYTHONPATH=. backend/.venv/bin/pytest backend/tests -v
```

Expected: all PASS.

- [ ] **Step 6: Run the full worker test suite one more time**

```bash
cd /Users/mostofa.mohiuddin/Work/rnd/mail-sync/worker && go test ./...
```

Expected: all PASS.

- [ ] **Step 7: No commit needed**

Phase 6 is verification-only.

---

## Done

If you've reached here with all checkboxes ticked and Phase 6 verifies clean: shipping order is exactly the order tasks were committed (Phase 1 → 5). Each phase commit is independently revertable.
