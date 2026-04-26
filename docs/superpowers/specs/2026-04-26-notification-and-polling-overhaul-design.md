# Notification & Polling Overhaul — Design

**Date:** 2026-04-26
**Scope:** End-to-end rewrite of how new important mail is detected by the Go worker, classified by the backend, and pushed to the frontend.

## Problem

The current notification + polling pipeline has four compounding problems:

1. **Worker is wasteful and unreliable.** `worker/internal/important_mail_notification/service.go` loops over all linked mail addresses sequentially every 2 minutes. For each address it calls Gmail's history API, then for each new mail it makes a synchronous OpenAI call to decide importance. Failures `panic`. Two ticks can overlap. There is a real bug: `important_mail_notifications` is declared outside the per-address loop, so once one address has notifications, every subsequent address re-`AddImportantMailNotification`s the cumulative slice (duplicate notifications).
2. **Backend load from constant polling.** Every signed-in tab calls `GET /important-mail/notifications` every 10 seconds via SWR `refreshInterval` (`frontend/src/hooks/userSession/index.tsx:60`), returning the entire notification list each time. No conditional GET, no visibility-aware pause.
3. **UI feels stale.** Up to 10s lag between a notification landing in Mongo and the bell badge updating, plus another up-to-2-min lag in the worker before it lands at all. Worst case ~2m10s.
4. **Notifications can be missed or duplicated.** Beyond the cumulative-slice bug above, `LastMailHistoryId` updates only happen if `len(history.Mails) > 0`, but a panicking `callAPI` short-circuits the update path entirely, so transient errors can permanently strand mail.

The existing `backend/src/web_socket/` module is a stub: a single GET endpoint that does `redis.set("user", username)` and never opens a socket. It cannot be the basis of a real push channel.

## Goals

- New important mail visible in the UI within ~2 seconds of the worker detecting it (down from up to ~2m10s).
- One OpenAI classification call per address per tick (down from one per mail).
- Worker tick failures isolated to one address, never the whole tick.
- Zero duplicate notifications from the cumulative-slice bug.
- Zero polling from the frontend in steady state.

## Non-goals

- Gmail push (`users.watch` + Pub/Sub). Documented as a future epic; smart polling now.
- Browser `Notification` API integration. Bell badge only for this rewrite.
- Touching the unrelated `scheduled_mails` and `scheduled_auto_replies` cron jobs.
- Per-user SSE connection limits. Documented as a follow-up.
- Retroactive backfill of the new classification cache. Cold start is acceptable.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│ Go worker (cronjob)                                                 │
│                                                                     │
│   every 30s:                                                        │
│     1. fetch all linked addresses                                   │
│     2. fan out to a pool of 8 goroutines                            │
│     3. each goroutine, per address:                                 │
│        a. acquire Redis lock "lock:poll:{addr_id}" (SETNX, TTL 60s) │
│        b. call API GET /history (delta from LastMailHistoryId)      │
│        c. POST /important-mail/classify-batch (one call, all mails) │
│        d. POST /important-mail/notifications (only if any important)│
│        e. PUT /link-mail-address (update LastMailHistoryId)         │
│        f. release lock (only if value matches)                      │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │
                       ┌───────────▼────────────┐
                       │ FastAPI backend        │
                       │                        │
                       │ POST /notifications    │──► Mongo insert
                       │   then PUBLISH         │──► Redis channel
                       │   "notif:{username}"   │
                       └───────────┬────────────┘
                                   │
              ┌────────────────────▼────────────────────┐
              │ GET /notifications/stream  (SSE)        │
              │   - auth via short-lived ticket         │
              │   - SUBSCRIBE "notif:{username}"        │
              │   - yield {event: "new", data: {...}}   │
              │   - heartbeat ping every 25s            │
              └────────────────────┬────────────────────┘
                                   │
                  ┌────────────────▼────────────────┐
                  │ Frontend                        │
                  │  EventSource('/api/             │
                  │    notifications/stream?ticket) │
                  │  on 'new'   → SWR mutate +      │
                  │              optimistic prepend │
                  │  on 'error' → exp. backoff      │
                  │  on hidden  → close stream      │
                  │  on visible → reopen + 1 GET    │
                  └─────────────────────────────────┘
```

## Components

Each unit has one job, a clear interface, and can be tested in isolation.

### 1. Go worker — polling loop

**Files:** `worker/internal/cron/cron.go`, `worker/internal/important_mail_notification/service.go`, `worker/internal/mailsync/service.go`, new `worker/internal/lock/redis_lock.go`, new `worker/internal/pool/pool.go`, `worker/cmd/cronjob/main.go`.

**Responsibilities:** tick on a schedule, dispatch addresses to a worker pool, and call backend endpoints.

**Behavior:**

- **Tick interval:** `@every 30s` (was `@every 2m`) for the `AddImportantMailNotification` job. Other jobs unchanged.
- **Worker pool:** 8 goroutines drain a `chan LinkedMailAddress`. The pool is created inside `AddNotification`; lifetime is one tick. After all addresses are dispatched the channel is closed and the dispatcher waits on a `sync.WaitGroup`.
- **Per-address Redis lock:** `SET lock:poll:{addr_id} {worker_uuid} NX EX 60`. If the key already exists, log "skip — locked" and move on. On success path the goroutine `EVAL`s a small Lua script that deletes the key only if its value equals the worker UUID, so a slow tick can't release a lock the next tick now owns.
- **Error policy:** every `callAPI` returns `(*http.Response, error)`. The worker logs and skips on error; nothing panics. `mailsync.SendScheduledMails` (which currently `log.Panicln(err)`) is also fixed in passing because we are touching the file — single-line change.
- **Cumulative-slice fix:** `important_mail_notifications := []mailsync.ImportantMailNotification{}` is moved *inside* the per-address loop. Verified by a Go test.
- **No more per-mail OpenAI calls.** `mailsync.DetectImportantMail` is no longer called by the cron path. After `GetHistory`, the worker batches all returned mails into a single `POST /api/important-mail/classify-batch` and consumes the `is_important` flags from the response. The function is left in `mailsync` for ad-hoc tooling but marked deprecated in a comment.
- **`LastMailHistoryId` update:** only happens after the classify + insert path completes without error. If classify or notification-insert fails, the address's `LastMailHistoryId` is not advanced, so the next tick retries the same window. (Today the update can happen even if `AddImportantMailNotification` silently failed.)

**Interface (entry point):**
```go
func (s *ImportantMailNotificationService) AddNotification()
```
Same signature as today. The cron framework needs no change.

### 2. Backend — `important_mail` classify-batch

**Files:** `backend/src/important_mail/{routes,service,repositories,dtos,models}.py`, `backend/src/openai/openai_client.py`.

**New endpoint:** `POST /api/important-mail/classify-batch`

Request:
```json
{ "mails": [
    { "id": "msg_abc",
      "subject": "...",
      "sender": { "email": "...", "name": "..." },
      "snippet": "...",
      "headers": { "List-Unsubscribe": "...", "Precedence": "..." }
    }
] }
```

Response:
```json
{ "results": [ { "mail_id": "msg_abc", "is_important": true } ] }
```

**Service flow (`ImportantMailService.classify_batch`):**

1. **Pre-filter** (no AI):
   - `is_important = false` if any of:
     - `headers["List-Unsubscribe"]` is present, OR
     - `headers["Precedence"]` ∈ `{"bulk", "list", "junk"}`, OR
     - `sender.email` matches the receiver's own address (lookup via `linked_mail_address.address`), OR
     - `sender.email` local-part starts with `noreply` / `no-reply` / `donotreply`, OR
     - sender domain is in a small hardcoded `KNOWN_BULK_SENDERS` list (initially: `mailchimp.com`, `sendgrid.net`, `mailgun.org`, `notifications.github.com`).
   - Otherwise check the cache (next step).
2. **Cache hit:** look up `mail_id` in new Mongo collection `important_mail_classifications`. If present, return the stored `is_important`.
3. **Batch the remainder** into one `OpenAIClient.detect_important_batch(mails)` call. Uses `response_format=json_schema` (existing pattern in `openai_client.py`) with schema `[{ "id": str, "important": bool, "reason": str }]`.
4. **Persist** every result (including pre-filter and batch) to `important_mail_classifications` as `{ _id, mail_id (unique idx), is_important, reason, classified_at }`.
5. **Return** the results in the request's original order.

**Repository:** `ImportantMailClassificationRepository` with `get_by_mail_ids(ids)` and `upsert_many(rows)`.

**Why a separate Mongo collection** (not a field on `important_mail_notifications`): notifications exist only for important mails; classifications exist for every mail processed. Splitting keeps the notification collection lean and lets the cache truthfully remember "we already decided this mail was unimportant."

### 3. Backend — Redis publish on notification create

**Files:** `backend/src/important_mail/service.py`, new `backend/src/common/pubsub.py`.

**Behavior:** the existing `create_important_mail_notification` flow inserts into Mongo as today, then groups inserted notifications by `username` (resolved by joining `linked_mail_address_id → user.username` via `LinkMailAddressService`) and publishes one message per user:

```python
await pubsub.publish(
    f"notif:{username}",
    json.dumps({
        "type": "new_important_mail",
        "notifications": [serialize(n) for n in inserted_for_user],
    }),
)
```

**`backend/src/common/pubsub.py`** wraps `aioredis` with `publish(channel, payload: str)` and an async `subscribe(channel) -> AsyncIterator[bytes]`. Single shared client reused across requests via FastAPI dependency injection. Same Redis as today; no new env var.

### 4. Backend — SSE stream endpoint

**Files:** new `backend/src/notifications/{routes,service}.py`. The existing `backend/src/web_socket/` module is **deleted** (stub, never delivered a socket). `main.py` is updated to remove `web_socket_router` and add `notifications_router`.

**Endpoints:**

- `POST /api/notifications/stream/ticket` — auth via existing JWT bearer flow. Returns `{ "ticket": "<opaque>", "expires_in": 30 }`. The ticket is a random string written to Redis as `sse_ticket:{ticket} → username` with a 30-second TTL. Single-use: it is `GETDEL`-ed when the stream connects.
- `GET /api/notifications/stream?ticket=…` — exchanges the ticket for the username, then opens the SSE response.

**Why ticket auth** (not `?access_token=`): keeps long-lived JWTs out of access logs and out of the URL the browser shows. EventSource cannot send custom headers, so query-param auth is unavoidable; the ticket is the cheap mitigation.

**Stream handler:**

```python
async def notification_stream(request, username, redis):
    async def event_gen():
        async with redis.pubsub() as ps:
            await ps.subscribe(f"notif:{username}")
            yield "event: ready\ndata: {}\n\n"
            last_ping = time.monotonic()
            while True:
                msg = await ps.get_message(ignore_subscribe_messages=True, timeout=5)
                if msg and msg["type"] == "message":
                    yield f"event: new\ndata: {msg['data'].decode()}\n\n"
                if time.monotonic() - last_ping > 25:
                    yield ": ping\n\n"
                    last_ping = time.monotonic()
                if await request.is_disconnected():
                    break
    return StreamingResponse(
        event_gen(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
```

**Nginx:** `nginx/nginx.conf` gets a new `location /api/notifications/stream` block before the catch-all `/api/`, with `proxy_buffering off; proxy_read_timeout 1h; proxy_http_version 1.1;`. Without this, nginx will buffer the stream and clients will see no events until the buffer fills.

### 5. Frontend — useNotificationStream hook

**Files:** new `frontend/src/hooks/useNotificationStream/index.ts`, modify `frontend/src/hooks/userSession/index.tsx`, modify `frontend/src/components/layout/Header.tsx`, `frontend/src/api/ImportantMailNotification.ts` (add `getStreamTicket`).

**Hook contract:**
```ts
function useNotificationStream(opts: { enabled: boolean }): {
  connected: boolean;
}
```

The hook:
1. When `enabled && document.visibilityState === 'visible'`: `POST /api/notifications/stream/ticket`, then `new EventSource(\`/api/notifications/stream?ticket=${ticket}\`)`.
2. On `event: ready` → `setConnected(true)`.
3. On `event: new` → optimistic SWR mutate of `/important-mail/notifications` (prepend the inbound notifications), then a deferred `mutate('/important-mail/notifications')` 1s later to reconcile against the server.
4. On `error` → close the EventSource, schedule reconnect with exponential backoff (1s, 2s, 4s, 8s, capped at 30s). Reset backoff on next successful `ready`.
5. On `document.visibilitychange → hidden` → close stream, cancel pending reconnects.
6. On `visible` → fresh `mutate('/important-mail/notifications')` and reopen the stream.
7. Cleans up the EventSource on unmount.

**`useSession` changes:**
- `useSWR('/important-mail/notifications', …)` loses `refreshInterval: 10000`. The initial fetch and on-demand `mutate` calls remain.
- After the SWR call, `useNotificationStream({ enabled: hasAccessToken })` is invoked.

**`Header.tsx` `markAllAsRead` race fix:** today it calls the API and `mutate` synchronously; the mutate sees stale data because the API hasn't completed. Change to:
```ts
await api.markImportantMailNotificationAsRead({ data: ids });
await mutate('/important-mail/notifications');
```

## Data flow (happy path)

1. T+0s: a new mail arrives in user U's Gmail inbox.
2. T+0–30s: worker tick picks up address A (owned by U), acquires lock, calls `GET /history`, gets the new mail.
3. Worker calls `POST /important-mail/classify-batch` — pre-filter passes the mail through, OpenAI returns `important: true` (cached for next time).
4. Worker calls `POST /important-mail/notifications`. Backend inserts into Mongo, then `PUBLISH notif:U {…notification…}`.
5. SSE handler subscribed to `notif:U` (one per open tab) yields `event: new`.
6. Frontend hook receives the event, prepends to SWR cache, bell badge increments.
7. Worker calls `PUT /link-mail-address` to advance `LastMailHistoryId`, releases lock.

End-to-end latency from Gmail-arrival to UI-badge-update: **bounded by the 30s tick + ~1s push**, so 1–31 seconds.

## Error handling

- **Worker, address-level error** (HTTP failure, Mongo down, OpenAI down): log, skip address, do **not** advance `LastMailHistoryId`, release lock. Next tick retries.
- **Worker, classify-batch returns 5xx**: same as above; address skipped, retried next tick.
- **Backend, Redis publish fails**: the Mongo insert has already succeeded. We log the publish failure but return 200 to the worker. The next visibility-driven SWR mutate will pick the notification up. The SSE channel is best-effort.
- **SSE stream, Redis subscribe fails**: handler raises, FastAPI returns 500, browser EventSource's onerror fires, hook backs off and retries.
- **SSE stream, client disconnects**: `request.is_disconnected()` breaks the loop, `pubsub.unsubscribe` runs in the `async with` exit.
- **Ticket invalid/expired**: handler returns 401. Hook treats as fatal-for-now, waits 30s, refetches ticket.

## Testing

### Backend pytest (existing convention in `backend/tests/`)

- `test_classify_batch.py`:
  - Pre-filter rules: `List-Unsubscribe` present → `false` without OpenAI.
  - Self-sender → `false` without OpenAI.
  - Cache hit → `false`/`true` from collection without OpenAI call.
  - Mixed batch → OpenAI called once with only the unfiltered, uncached mails.
  - Results returned in input order.
- `test_create_notifications.py`:
  - On insert, `redis.publish` is called once per distinct username with the matching subset.
  - On Redis failure, the endpoint still returns 200 and the Mongo write persists.
- `test_notifications_stream.py`:
  - Yields `ready` first.
  - Forwards a published message as `event: new`.
  - Emits `: ping` heartbeat after 25s (use `freezegun`).
  - Disconnects cleanly when client drops.

### Worker Go tests

- `lock_test.go`: acquire/release happy path; second acquire while held → `ErrLocked`; release with mismatched UUID is a no-op.
- `service_test.go` (mock the API client):
  - Two addresses, each with one important mail → exactly one `AddImportantMailNotification` call per address, payload contains only that address's notification (cumulative-slice regression).
  - API returns 500 for address A → address A skipped, address B still processed, no panic.
  - `LastMailHistoryId` not advanced when classify call fails.

### Frontend

No tests in this scope. The `frontend/` package has no test infrastructure today; introducing it is out of scope.

## Rollout order

Each step is independently shippable.

1. **Backend:** add `important_mail_classifications` collection + `classify_batch` endpoint. No consumers yet.
2. **Backend:** add Redis publish to `create_important_mail_notification`. No consumers yet.
3. **Backend + nginx:** add SSE endpoint + ticket endpoint + nginx location block. Verify with `curl -N` against staging.
4. **Worker:** rewrite the polling loop (parallel pool, lock, batch call, 30s tick, bug fixes). At this point latency is already down to ~30s and OpenAI cost is down ~10x even without the frontend change.
5. **Frontend:** `useNotificationStream` hook + drop SWR `refreshInterval`. Verify SSE end-to-end before merging — once this lands, polling is gone.

## Cleanup

- **Delete** `backend/src/web_socket/` (stub, never used).
- **Delete** `backend/src/mail_notification/` (only contains the unused `MailHistory` model).
- Remove `web_socket_router` from `backend/main.py`.
- Mark `mailsync.DetectImportantMail` as deprecated (`// Deprecated: use classify_batch via worker`); keep the function for ad-hoc tooling until the next cleanup pass.

## Future work (explicitly deferred)

- Gmail `users.watch` + Pub/Sub push. Removes polling entirely; ~1s latency. Requires GCP Pub/Sub setup + 7-day watch renewal job.
- Browser `Notification` API (with a per-user opt-in toggle).
- Per-user SSE connection cap (e.g. 5/user via Redis counter).
- Backfill of `important_mail_classifications` cache from historical `important_mail_notifications`.
