# Single Email Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the single-email page lead with AI (hero summary above body), replace the right-side reply drawer with a Gmail-style bottom-right floating composer, and rebuild the composer as a single theme-aware card with tone chips that generate replies directly into the editor.

**Architecture:**
- Backend: extend `process-with-ai` endpoint with an optional `tone` enum that injects tone-specific instructions into the REPLY system prompt. No new endpoints, no breaking changes.
- Frontend: restructure `MailViewer/index.tsx`; new `ComposerSheet` component for the floating bottom-right reply UI; rebuild `UserReplyMail` / `ReplyDataInput` / `RichTextEditor` to use theme tokens; delete `AiReplyMail` and replace it with tone chips driven from the editor.

**Tech Stack:** FastAPI + Pydantic (backend), React + TypeScript + Ant Design + Draft.js (`@draft-js-plugins/editor`, `draft-js-export-html`, `draft-js`'s `convertFromHTML`) (frontend), `useThemeMode()` hook + token palette in `src/themes/tokens.ts`.

**Spec:** `docs/superpowers/specs/2026-04-26-single-email-redesign.md`

---

## File Structure

**Backend (modify):**
- `backend/src/mails/models.py` — add `ProcessMailWithAIRequestTone` enum and optional `tone` field on `ProcessMailWithAIRequestBody`.
- `backend/src/mails/service.py` — add `TONE_INSTRUCTIONS` map and inject tone string into `REPLY` system prompt when `tone` is supplied.

**Backend (create):**
- `backend/tests/mails/__init__.py` — package marker.
- `backend/tests/mails/test_service.py` — pytest coverage for `_generate_prompt` tone behavior.

**Frontend (modify):**
- `frontend/src/common/types.tsx` — add `IProcessMailTone` enum.
- `frontend/src/pages/mails/ReplyMail/ReplyDataInput.tsx` — add `label` prop, theme-aware borderless row.
- `frontend/src/components/RichTextEditor.tsx` — drop hardcoded colors, accept `height?` prop, accept external toolbar slot.
- `frontend/src/pages/mails/ReplyMail/UserReplyMail.tsx` — labeled-row inputs, tone chips, theme-aware footer; delete the gradient eyebrow header.
- `frontend/src/pages/mails/ReplyMail/index.tsx` — drop `AiReplyMail`, pass `receivedMailBody` through to `UserReplyMail`.
- `frontend/src/pages/mails/MailViewer/index.tsx` — hero summary above body, drop `Drawer`/`FloatButton`/`width: 50%`; render `ComposerSheet`.
- `frontend/src/pages/mails/MailViewer/SummarizeMail.tsx` — shimmer skeleton, accept `onGradient?` prop for white-on-gradient text.

**Frontend (create):**
- `frontend/src/pages/mails/ReplyMail/ComposerSheet.tsx` — floating bottom-right shell (collapsed pill / expanded card / minimized states + header bar).

**Frontend (delete):**
- `frontend/src/pages/mails/ReplyMail/AiReplyMail.tsx`.

---

## Task 1: Backend — add `ProcessMailWithAIRequestTone` enum and optional `tone` field

**Files:**
- Modify: `backend/src/mails/models.py`

- [ ] **Step 1: Add the tone enum and request-body field**

Replace the contents of `backend/src/mails/models.py` with:

```python
from enum import Enum

from pydantic import BaseModel


class MailBody(BaseModel):
    html: str
    plain: str


class MailRequestBody(BaseModel):
    sender: str
    receiver: str
    subject: str
    body: MailBody


class ProcessMailWithAIRequestType(Enum):
    SUMMARY = "SUMMARY"
    REPLY = "REPLY"
    GENERATE = "GENERATE"


class ProcessMailWithAIRequestTone(str, Enum):
    FRIENDLY = "FRIENDLY"
    CONCISE = "CONCISE"
    FORMAL = "FORMAL"
    DECLINE = "DECLINE"
    ENTHUSIASTIC = "ENTHUSIASTIC"


class ProcessMailWithAIRequestBody(BaseModel):
    message: str
    request_type: ProcessMailWithAIRequestType
    tone: ProcessMailWithAIRequestTone | None = None
```

- [ ] **Step 2: Verify the module still imports**

Run: `cd backend && poetry run python -c "from src.mails.models import ProcessMailWithAIRequestBody, ProcessMailWithAIRequestTone; print(ProcessMailWithAIRequestTone.FRIENDLY.value)"`
Expected: prints `FRIENDLY`.

- [ ] **Step 3: Commit**

```bash
git add backend/src/mails/models.py
git commit -m "feat(backend): add optional tone field to process-with-ai request"
```

---

## Task 2: Backend — write failing test for tone-aware REPLY prompt

**Files:**
- Create: `backend/tests/mails/__init__.py`
- Create: `backend/tests/mails/test_service.py`

- [ ] **Step 1: Create empty package marker**

Create `backend/tests/mails/__init__.py` with empty content.

- [ ] **Step 2: Write failing test for tone injection and default behavior**

Create `backend/tests/mails/test_service.py` with:

```python
from unittest.mock import MagicMock

import pytest

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
```

- [ ] **Step 3: Run the tests — they must fail**

Run: `cd backend && PYTHONPATH=.. poetry run pytest tests/mails/test_service.py -v`

(The `PYTHONPATH=..` is required because the codebase imports its own modules as `backend.src.*`; this puts the repo root on `sys.path` so `backend.*` resolves. This is a pre-existing infrastructure quirk, not introduced by this plan.)
Expected: 4 failures — the parametrized `test_reply_prompt_with_tone_appends_tone_instruction` cases all fail because tone is not yet honored. `test_reply_prompt_without_tone_matches_default`, `test_summary_prompt_ignores_tone`, and `test_generate_prompt_ignores_tone` should pass already (default behavior is unchanged so far).

- [ ] **Step 4: Commit failing tests**

```bash
git add backend/tests/mails/__init__.py backend/tests/mails/test_service.py
git commit -m "test(backend): cover tone injection in process-with-ai prompt builder"
```

---

## Task 3: Backend — implement tone injection in `_generate_prompt`

**Files:**
- Modify: `backend/src/mails/service.py:158-175`

- [ ] **Step 1: Add `TONE_INSTRUCTIONS` constant and tone-aware REPLY prompt**

Open `backend/src/mails/service.py`. Find the existing `_generate_prompt` method (currently at lines 158–175). Replace it with the version below, and add the `TONE_INSTRUCTIONS` mapping at module scope just above the `MailSyncService` class.

Add at module scope (immediately above `class MailSyncService`). The existing service file already imports `ProcessMailWithAIRequestBody` and `ProcessMailWithAIRequestType` from `backend.src.mails.models` — extend that import to include the new tone enum:

```python
from backend.src.mails.models import (
    ProcessMailWithAIRequestBody,
    ProcessMailWithAIRequestTone,
    ProcessMailWithAIRequestType,
)

TONE_INSTRUCTIONS = {
    ProcessMailWithAIRequestTone.FRIENDLY:
        "Use a warm, friendly tone with a personal touch.",
    ProcessMailWithAIRequestTone.CONCISE:
        "Keep the reply short and to the point — 2 to 3 sentences.",
    ProcessMailWithAIRequestTone.FORMAL:
        "Use a professional, formal tone suitable for business correspondence.",
    ProcessMailWithAIRequestTone.DECLINE:
        "Politely decline the request while remaining respectful.",
    ProcessMailWithAIRequestTone.ENTHUSIASTIC:
        "Express genuine enthusiasm and positivity.",
}
```

(If the imports already exist, deduplicate — keep one canonical import block.)

Replace the body of `_generate_prompt`:

```python
    def _generate_prompt(self, request: ProcessMailWithAIRequestBody) -> dict:
        prompts = {
            ProcessMailWithAIRequestType.GENERATE: {
                "system_prompt": "You are an email generator. Given a message, you generate an email. use div tag for new line.",
                "prompt": f"Please generate an email for the message: {request.message}",
            },
            ProcessMailWithAIRequestType.SUMMARY: {
                "system_prompt": "You are a mail summarizer. You summarize the mail. and reply in bullet points. use div tag for each point.",
                "prompt": f"Please help summarize the email: {request.message}.",
            },
            ProcessMailWithAIRequestType.REPLY: {
                "system_prompt": "You are a mail writer. You write a reply to the mail. and use div tag for new line.",
                "prompt": f"Please help me write a reply to the email: {request.message}",
            },
        }

        selected = prompts.get(request.request_type, prompts[ProcessMailWithAIRequestType.GENERATE])

        if (
            request.request_type == ProcessMailWithAIRequestType.REPLY
            and request.tone is not None
        ):
            tone_instruction = TONE_INSTRUCTIONS[request.tone]
            selected = {
                **selected,
                "system_prompt": f"{selected['system_prompt']}\n\nTone: {tone_instruction}",
            }

        return selected
```

- [ ] **Step 2: Run the tests — all should pass**

Run: `cd backend && PYTHONPATH=.. poetry run pytest tests/mails/test_service.py -v`

(The `PYTHONPATH=..` is required because the codebase imports its own modules as `backend.src.*`; this puts the repo root on `sys.path` so `backend.*` resolves. This is a pre-existing infrastructure quirk, not introduced by this plan.)
Expected: 8 passed (1 default + 5 parametrized tone cases + 1 SUMMARY ignore + 1 GENERATE ignore).

- [ ] **Step 3: Run the full backend test suite to confirm no regressions**

Run: `cd backend && poetry run pytest -v`
Expected: all previously passing tests still pass.

- [ ] **Step 4: Commit**

```bash
git add backend/src/mails/service.py
git commit -m "feat(backend): inject tone-specific instructions into REPLY prompts"
```

---

## Task 4: Frontend — add `IProcessMailTone` enum

**Files:**
- Modify: `frontend/src/common/types.tsx:82-86`

- [ ] **Step 1: Add the tone enum below `IProcessEmailType`**

Open `frontend/src/common/types.tsx`. Find:

```tsx
export enum IProcessEmailType {
  REPLY = 'REPLY',
  GENERATE = 'GENERATE',
  SUMMARY = 'SUMMARY',
}
```

Add immediately after it:

```tsx
export enum IProcessMailTone {
  FRIENDLY = 'FRIENDLY',
  CONCISE = 'CONCISE',
  FORMAL = 'FORMAL',
  DECLINE = 'DECLINE',
  ENTHUSIASTIC = 'ENTHUSIASTIC',
}
```

- [ ] **Step 2: Type-check the frontend**

Run: `cd frontend && npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/common/types.tsx
git commit -m "feat(frontend): add IProcessMailTone enum for tone-aware AI replies"
```

---

## Task 5: Frontend — refactor `ReplyDataInput` into a labeled row

**Files:**
- Modify: `frontend/src/pages/mails/ReplyMail/ReplyDataInput.tsx`

- [ ] **Step 1: Replace the file with a theme-aware labeled row**

Replace the entire contents of `frontend/src/pages/mails/ReplyMail/ReplyDataInput.tsx` with:

```tsx
import { Input } from 'antd';

import { useThemeMode } from '../../../hooks/useThemeMode';

interface ReplyDataInputProps {
  label: string;
  value: string;
  setValue: (value: string) => void;
  placeholder?: string;
}

export default function ReplyDataInput({ label, value, setValue, placeholder }: ReplyDataInputProps) {
  const { colors } = useThemeMode();
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        borderBottom: `1px solid ${colors.border}`,
        background: 'transparent',
      }}
    >
      <span
        style={{
          width: 64,
          flexShrink: 0,
          fontSize: 12,
          color: colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </span>
      <Input
        placeholder={placeholder}
        variant="borderless"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{ fontSize: '0.9rem', padding: 0, color: colors.text }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `cd frontend && npx tsc --noEmit`
Expected: errors **expected** at the existing call-sites in `UserReplyMail.tsx` (label not passed). These will be fixed in Task 7. No errors elsewhere.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/mails/ReplyMail/ReplyDataInput.tsx
git commit -m "feat(frontend): make ReplyDataInput a labeled theme-aware row"
```

---

## Task 6: Frontend — refactor `RichTextEditor` to use theme tokens and accept `height` + external toolbar

**Files:**
- Modify: `frontend/src/components/RichTextEditor.tsx`

- [ ] **Step 1: Replace the file**

Replace the entire contents of `frontend/src/components/RichTextEditor.tsx` with:

```tsx
import { useRef } from 'react';

import {
  BoldButton,
  ItalicButton,
  UnderlineButton,
  CodeButton,
  UnorderedListButton,
  OrderedListButton,
  BlockquoteButton,
  CodeBlockButton,
} from '@draft-js-plugins/buttons';
import Editor from '@draft-js-plugins/editor';
import createToolbarPlugin from '@draft-js-plugins/static-toolbar';
import { EditorState } from 'draft-js';

import { useThemeMode } from '../hooks/useThemeMode';

const toolbarPlugin = createToolbarPlugin();
const { Toolbar } = toolbarPlugin;
const plugins = [toolbarPlugin];

interface RichTextEditorProps {
  editorState: EditorState;
  setEditorState: (editorState: EditorState) => void;
  height?: number | string;
  hideToolbar?: boolean;
}

const RichTextEditor = ({
  editorState,
  setEditorState,
  height = '25rem',
  hideToolbar = false,
}: RichTextEditorProps) => {
  const editorRef = useRef<Editor>(null);
  const { colors } = useThemeMode();

  const onChange = (newEditorState: EditorState) => {
    setEditorState(newEditorState);
  };

  const focus = () => {
    editorRef.current?.focus();
  };

  return (
    <div>
      <div
        style={{
          cursor: 'text',
          background: colors.surface,
          color: colors.text,
          height,
          overflow: 'auto',
          padding: '12px 14px',
        }}
        onClick={focus}
      >
        <Editor
          editorState={editorState}
          onChange={onChange}
          plugins={plugins}
          ref={editorRef}
          formatPastedText={(text, html) => ({ html, text })}
        />
      </div>
      {!hideToolbar && (
        <Toolbar>
          {(externalProps) => (
            <>
              <BoldButton {...externalProps} />
              <ItalicButton {...externalProps} />
              <UnderlineButton {...externalProps} />
              <CodeButton {...externalProps} />
              <UnorderedListButton {...externalProps} />
              <OrderedListButton {...externalProps} />
              <BlockquoteButton {...externalProps} />
              <CodeBlockButton {...externalProps} />
            </>
          )}
        </Toolbar>
      )}
    </div>
  );
};

export { Toolbar as RichTextToolbar };
export default RichTextEditor;
```

The named `RichTextToolbar` export lets `UserReplyMail` render the toolbar in the composer footer (Task 7) instead of inline.

- [ ] **Step 2: Type-check**

Run: `cd frontend && npx tsc --noEmit`
Expected: no new errors from this file. (Errors from Task 5 may still be present until Task 7.)

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/RichTextEditor.tsx
git commit -m "feat(frontend): theme-aware RichTextEditor with configurable height and detachable toolbar"
```

---

## Task 7: Frontend — rebuild `UserReplyMail` with labeled rows, tone chips, theme footer

**Files:**
- Modify: `frontend/src/pages/mails/ReplyMail/UserReplyMail.tsx`

This task wires together the new `ReplyDataInput` (label-based), the tone chips that call `processMailWithAI` with the new `tone` parameter, and the new footer layout. It also accepts `receivedMailBody` so chips can generate from the original mail.

- [ ] **Step 1: Replace the file**

Replace the entire contents of `frontend/src/pages/mails/ReplyMail/UserReplyMail.tsx` with:

```tsx
import { useRef, useState } from 'react';

import { DownOutlined, ThunderboltOutlined, UndoOutlined } from '@ant-design/icons';
import {
  BoldButton,
  ItalicButton,
  UnderlineButton,
  CodeButton,
  UnorderedListButton,
  OrderedListButton,
  BlockquoteButton,
  CodeBlockButton,
} from '@draft-js-plugins/buttons';
import { createEditorStateWithText } from '@draft-js-plugins/editor';
import {
  Button,
  DatePicker,
  Dropdown,
  Flex,
  Select,
  Space,
  Spin,
  Tag,
  notification,
  type DatePickerProps,
  type MenuProps,
} from 'antd';
import type { Dayjs } from 'dayjs';
import { ContentState, EditorState, convertFromHTML } from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';

import ReplyDataInput from './ReplyDataInput';
import * as api from '../../../api/Mail';
import { IProcessEmailType, IProcessMailTone } from '../../../common/types';
import RichTextEditor, { RichTextToolbar } from '../../../components/RichTextEditor';
import { useThemeMode } from '../../../hooks/useThemeMode';
import { useSession } from '../../../hooks/userSession';

interface UserReplyMailProps {
  receiverEmail?: string;
  replySubject?: string;
  receivedMailBody?: string;
  editorHeight?: number | string;
}

const TONE_PRESETS: { tone: IProcessMailTone; label: string }[] = [
  { tone: IProcessMailTone.FRIENDLY, label: 'Friendly' },
  { tone: IProcessMailTone.CONCISE, label: 'Concise' },
  { tone: IProcessMailTone.FORMAL, label: 'Formal' },
  { tone: IProcessMailTone.DECLINE, label: 'Decline politely' },
  { tone: IProcessMailTone.ENTHUSIASTIC, label: 'Enthusiastic' },
];

const editorStateFromHtml = (html: string): EditorState => {
  if (!html) return createEditorStateWithText('');
  const blocksFromHTML = convertFromHTML(html);
  if (!blocksFromHTML.contentBlocks?.length) return createEditorStateWithText('');
  const content = ContentState.createFromBlockArray(
    blocksFromHTML.contentBlocks,
    blocksFromHTML.entityMap,
  );
  return EditorState.createWithContent(content);
};

export default function UserReplyMail({
  receiverEmail,
  replySubject,
  receivedMailBody,
  editorHeight = '25rem',
}: UserReplyMailProps) {
  const { colors } = useThemeMode();
  const [editorState, setEditorState] = useState<EditorState>(createEditorStateWithText(''));
  const [receiver, setReceiver] = useState(receiverEmail || '');
  const [subject, setSubject] = useState(replySubject || '');
  const [sender, setSender] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendOption, setSendOption] = useState('SEND');
  const [scheduleDate, setScheduleDate] = useState<Dayjs | null>(null);
  const [activeTone, setActiveTone] = useState<IProcessMailTone | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const previousEditorStateRef = useRef<EditorState | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { linkedMailAddresses } = useSession();

  const resetData = () => {
    setEditorState(createEditorStateWithText(''));
    setSubject('');
    setReceiver('');
    setSender(null);
    setScheduleDate(null);
  };

  const sendMail = async () => {
    setIsSending(true);
    const plainBody = editorState.getCurrentContent().getPlainText();
    const htmlBody = stateToHTML(editorState.getCurrentContent());
    const res = await api.sendMail({ data: { receiver, subject, body: { html: htmlBody, plain: plainBody }, sender } });
    if (res?.data?.labelIds?.length > 0 && res?.data?.labelIds[0] === 'SENT') {
      notification.success({
        message: 'Mail Sent',
        description: 'Your mail has been sent successfully.',
      });
      resetData();
    }
    setIsSending(false);
  };

  const scheduleMail = async () => {
    setIsSending(true);
    const plainBody = editorState.getCurrentContent().getPlainText();
    const htmlBody = stateToHTML(editorState.getCurrentContent());
    try {
      const res = await api.scheduleMail({
        data: {
          receiver,
          subject,
          body: { html: htmlBody, plain: plainBody },
          sender,
          scheduled_at: scheduleDate?.toISOString(),
        },
      });
      if (res?.status === 201) {
        notification.success({
          message: 'Mail Scheduled',
          description: 'Your mail has been scheduled successfully.',
        });
        resetData();
      }
    } catch (_) {
      /* empty */
    }
    setIsSending(false);
  };

  const generateWithTone = async (tone: IProcessMailTone) => {
    if (!receivedMailBody || activeTone) return;
    setActiveTone(tone);
    try {
      const res = await api.processMailWithAI({
        data: {
          message: receivedMailBody,
          request_type: IProcessEmailType.REPLY,
          tone,
        },
      });
      const draftHtml = res?.data?.processed_mail || '';
      if (draftHtml) {
        previousEditorStateRef.current = editorState;
        setEditorState(editorStateFromHtml(draftHtml));
        setShowUndo(true);
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        undoTimerRef.current = setTimeout(() => setShowUndo(false), 5000);
      }
    } catch (_) {
      notification.error({
        message: 'AI draft failed',
        description: 'Could not generate a reply. Try again.',
      });
    } finally {
      setActiveTone(null);
    }
  };

  const undoAiDraft = () => {
    if (previousEditorStateRef.current) {
      setEditorState(previousEditorStateRef.current);
      previousEditorStateRef.current = null;
    }
    setShowUndo(false);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  };

  const isSendButtonDisabled = () => {
    const plainBody = editorState.getCurrentContent().getPlainText();
    const htmlBody = stateToHTML(editorState.getCurrentContent());
    const hasAllCommonFields = htmlBody && plainBody && sender && receiver && subject;
    if (sendOption === 'SEND') {
      return !hasAllCommonFields;
    }
    return !(hasAllCommonFields && scheduleDate);
  };

  const onDateChange: DatePickerProps['onChange'] = (date) => {
    setScheduleDate(date);
  };

  const sendOptions: MenuProps['items'] = [
    { label: 'Send', key: 'SEND' },
    { label: 'Schedule', key: 'SCHEDULE' },
  ];

  const senderOptions = linkedMailAddresses?.map((mail) => ({
    value: mail.email,
    label: `${mail.email_name} <${mail.email}>`,
    email: mail.email,
    name: mail.email_name,
    picture: mail.picture,
  }));

  const showToneChips = !!receivedMailBody;

  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 14,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <ReplyDataInput label="To" value={receiver} setValue={setReceiver} placeholder="recipient@example.com" />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <span
          style={{
            width: 64,
            flexShrink: 0,
            fontSize: 12,
            color: colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          From
        </span>
        <Select
          value={sender}
          variant="borderless"
          style={{ width: '100%', fontSize: '0.9rem' }}
          onChange={(value) => setSender(value)}
          placeholder="Choose a linked address"
          options={senderOptions}
          optionRender={(option) => (
            <Flex align="center" justify="start">
              <img
                src={option.data.picture}
                alt={option.data.name}
                style={{ width: 24, height: 24, borderRadius: '50%' }}
              />
              <span style={{ paddingLeft: 8 }}>{option.data.email}</span>
            </Flex>
          )}
        />
      </div>

      <ReplyDataInput label="Subject" value={subject} setValue={setSubject} placeholder="Subject" />

      {showToneChips && (
        <div
          style={{
            padding: '10px 14px',
            borderBottom: `1px solid ${colors.border}`,
            background: colors.surfaceMuted,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 8,
              fontSize: 12,
              color: colors.textSecondary,
            }}
          >
            <ThunderboltOutlined style={{ color: colors.primary }} />
            <span>Reply with AI</span>
            {showUndo && (
              <Button
                type="link"
                size="small"
                icon={<UndoOutlined />}
                onClick={undoAiDraft}
                style={{ marginLeft: 'auto', padding: 0, height: 'auto' }}
              >
                Undo AI draft
              </Button>
            )}
          </div>
          <Space size={[6, 6]} wrap>
            {TONE_PRESETS.map((preset) => {
              const isActive = activeTone === preset.tone;
              const disabled = activeTone !== null && !isActive;
              return (
                <Tag.CheckableTag
                  key={preset.tone}
                  checked={isActive}
                  onChange={() => !disabled && generateWithTone(preset.tone)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 999,
                    border: `1px solid ${colors.border}`,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.5 : 1,
                  }}
                >
                  {isActive ? <Spin size="small" style={{ marginRight: 6 }} /> : null}
                  {preset.label}
                </Tag.CheckableTag>
              );
            })}
          </Space>
        </div>
      )}

      <RichTextEditor
        editorState={editorState}
        setEditorState={setEditorState}
        height={editorHeight}
        hideToolbar
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '8px 12px',
          borderTop: `1px solid ${colors.border}`,
          background: colors.surfaceMuted,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RichTextToolbar>
            {(externalProps) => (
              <>
                <BoldButton {...externalProps} />
                <ItalicButton {...externalProps} />
                <UnderlineButton {...externalProps} />
                <CodeButton {...externalProps} />
                <UnorderedListButton {...externalProps} />
                <OrderedListButton {...externalProps} />
                <BlockquoteButton {...externalProps} />
                <CodeBlockButton {...externalProps} />
              </>
            )}
          </RichTextToolbar>
        </div>
        <Flex align="center" gap={8}>
          {sendOption === 'SCHEDULE' && (
            <DatePicker onChange={onDateChange} showTime value={scheduleDate} />
          )}
          <Dropdown.Button
            menu={{ items: sendOptions, onClick: (e) => setSendOption(e.key) }}
            type="primary"
            icon={<DownOutlined />}
            onClick={() => (sendOption === 'SEND' ? sendMail() : scheduleMail())}
            loading={isSending}
            disabled={isSendButtonDisabled()}
          >
            {sendOption === 'SEND' ? 'Send' : 'Schedule'}
          </Dropdown.Button>
        </Flex>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors. The earlier breakage from Task 5 (missing `label` props) is now resolved here.

- [ ] **Step 3: Lint**

Run: `cd frontend && npx eslint src/pages/mails/ReplyMail/UserReplyMail.tsx --max-warnings 0`
Expected: clean (no `require()` usage, no unused imports).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/mails/ReplyMail/UserReplyMail.tsx
git commit -m "feat(frontend): rebuild reply composer with tone chips and theme tokens"
```

---

## Task 8: Frontend — simplify `ReplyMail/index.tsx` and delete `AiReplyMail`

**Files:**
- Modify: `frontend/src/pages/mails/ReplyMail/index.tsx`
- Delete: `frontend/src/pages/mails/ReplyMail/AiReplyMail.tsx`

- [ ] **Step 1: Replace `ReplyMail/index.tsx`**

Replace the entire contents of `frontend/src/pages/mails/ReplyMail/index.tsx` with:

```tsx
import { convert } from 'html-to-text';

import UserReplyMail from './UserReplyMail';
import type { IEmailFullData } from '../../../common/types';

interface ReplyMailProps {
  receivedMail?: IEmailFullData;
  editorHeight?: number | string;
}

export default function ReplyMail({ receivedMail, editorHeight }: ReplyMailProps) {
  const receivedBody = receivedMail
    ? receivedMail.body.plain || convert(receivedMail.body.html ?? '') || ''
    : '';
  return (
    <UserReplyMail
      receiverEmail={receivedMail?.sender.email}
      replySubject={receivedMail?.subject ? `RE: ${receivedMail.subject}` : ''}
      receivedMailBody={receivedBody}
      editorHeight={editorHeight}
    />
  );
}
```

- [ ] **Step 2: Delete `AiReplyMail.tsx`**

Run: `git rm frontend/src/pages/mails/ReplyMail/AiReplyMail.tsx`

- [ ] **Step 3: Type-check**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Confirm no remaining references to `AiReplyMail`**

Run: `grep -rn "AiReplyMail" frontend/src`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/mails/ReplyMail/index.tsx
git commit -m "refactor(frontend): drop AiReplyMail card in favor of in-composer tone chips"
```

---

## Task 9: Frontend — create `ComposerSheet` floating shell

**Files:**
- Create: `frontend/src/pages/mails/ReplyMail/ComposerSheet.tsx`

- [ ] **Step 1: Create the file**

Create `frontend/src/pages/mails/ReplyMail/ComposerSheet.tsx` with:

```tsx
import { useState, type ReactNode } from 'react';

import { CloseOutlined, EditOutlined, MinusOutlined, UpOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';

import { useThemeMode } from '../../../hooks/useThemeMode';
import { shadow as lightShadow, shadowDark } from '../../../themes/tokens';

type SheetState = 'collapsed' | 'expanded' | 'minimized';

interface ComposerSheetProps {
  recipientLabel?: string;
  subject?: string;
  defaultOpen?: boolean;
  children: (api: { editorHeight: string }) => ReactNode;
}

const SHEET_WIDTH = 560;
const SHEET_HEIGHT = 640;
const SHEET_OFFSET = 24;
const SHEET_Z_INDEX = 1010;

export default function ComposerSheet({
  recipientLabel,
  subject,
  defaultOpen = false,
  children,
}: ComposerSheetProps) {
  const { colors, mode } = useThemeMode();
  const shadows = mode === 'dark' ? shadowDark : lightShadow;
  const [state, setState] = useState<SheetState>(defaultOpen ? 'expanded' : 'collapsed');

  const open = () => setState('expanded');
  const minimize = () => setState('minimized');
  const close = () => setState('collapsed');

  if (state === 'collapsed') {
    return (
      <button
        type="button"
        onClick={open}
        style={{
          position: 'fixed',
          right: SHEET_OFFSET,
          bottom: SHEET_OFFSET,
          zIndex: SHEET_Z_INDEX,
          minWidth: 220,
          height: 48,
          padding: '0 18px',
          borderRadius: 999,
          border: 'none',
          cursor: 'pointer',
          background: colors.primaryGradient,
          color: '#FFFFFF',
          boxShadow: shadows.lg,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 14,
          fontWeight: 500,
        }}
      >
        <EditOutlined />
        <span>Reply{recipientLabel ? ` to ${recipientLabel}` : ''}…</span>
      </button>
    );
  }

  if (state === 'minimized') {
    return (
      <button
        type="button"
        onClick={open}
        style={{
          position: 'fixed',
          right: SHEET_OFFSET,
          bottom: SHEET_OFFSET,
          zIndex: SHEET_Z_INDEX,
          minWidth: 280,
          maxWidth: 360,
          height: 44,
          padding: '0 14px',
          borderRadius: 12,
          border: `1px solid ${colors.border}`,
          cursor: 'pointer',
          background: colors.surfaceElevated,
          color: colors.text,
          boxShadow: shadows.md,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 13,
          textAlign: 'left',
        }}
      >
        <UpOutlined style={{ color: colors.textSecondary }} />
        <span
          style={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {subject || 'Draft reply'}
        </span>
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        right: SHEET_OFFSET,
        bottom: SHEET_OFFSET,
        zIndex: SHEET_Z_INDEX,
        width: SHEET_WIDTH,
        maxWidth: `calc(100vw - ${SHEET_OFFSET * 2}px)`,
        height: SHEET_HEIGHT,
        maxHeight: `calc(100vh - ${SHEET_OFFSET * 2}px)`,
        background: colors.surfaceElevated,
        border: `1px solid ${colors.border}`,
        borderRadius: 20,
        boxShadow: shadows.xl,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: 48,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px 0 16px',
          background: colors.primaryGradient,
          color: '#FFFFFF',
        }}
      >
        <span
          style={{
            flex: 1,
            fontSize: 13,
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {subject || 'New message'}
        </span>
        <Tooltip title="Minimize">
          <Button
            type="text"
            size="small"
            icon={<MinusOutlined />}
            onClick={minimize}
            style={{ color: '#FFFFFF' }}
          />
        </Tooltip>
        <Tooltip title="Close">
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={close}
            style={{ color: '#FFFFFF' }}
          />
        </Tooltip>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {children({ editorHeight: '100%' })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/mails/ReplyMail/ComposerSheet.tsx
git commit -m "feat(frontend): add bottom-right floating ComposerSheet shell"
```

---

## Task 10: Frontend — update `SummarizeMail` with shimmer skeleton + on-gradient mode

**Files:**
- Modify: `frontend/src/pages/mails/MailViewer/SummarizeMail.tsx`

- [ ] **Step 1: Replace the file**

Replace the entire contents of `frontend/src/pages/mails/MailViewer/SummarizeMail.tsx` with:

```tsx
import { useEffect, useState } from 'react';

import parse from 'html-react-parser';
import useSWR from 'swr';

import * as api from '../../../api/Mail';

interface SummarizeMailProps {
  text: string;
  onGradient?: boolean;
}

const SkeletonLine = ({ width, opacity }: { width: string; opacity: number }) => (
  <div
    style={{
      width,
      height: 12,
      borderRadius: 6,
      background: `rgba(255,255,255,${opacity})`,
      marginBottom: 10,
    }}
  />
);

export default function SummarizeMail({ text, onGradient = false }: SummarizeMailProps) {
  const [summary, setSummary] = useState('');

  const { data, isLoading } = useSWR(['/mails/process-with-ai', text, 'SUMMARY'], () =>
    api.processMailWithAI({ data: { message: text, request_type: 'SUMMARY' } }),
  );

  useEffect(() => {
    setSummary(data?.data?.processed_mail || '');
  }, [data]);

  if (isLoading) {
    return (
      <div style={{ paddingTop: 4 }}>
        <SkeletonLine width="92%" opacity={onGradient ? 0.35 : 0.18} />
        <SkeletonLine width="78%" opacity={onGradient ? 0.3 : 0.14} />
        <SkeletonLine width="60%" opacity={onGradient ? 0.25 : 0.12} />
      </div>
    );
  }

  return (
    <div
      style={{
        fontSize: '0.95rem',
        lineHeight: 1.6,
        color: onGradient ? 'rgba(255,255,255,0.95)' : undefined,
      }}
    >
      {parse(summary)}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/mails/MailViewer/SummarizeMail.tsx
git commit -m "feat(frontend): shimmer skeleton and on-gradient text mode for SummarizeMail"
```

---

## Task 11: Frontend — restructure `MailViewer/index.tsx` with hero summary and `ComposerSheet`

**Files:**
- Modify: `frontend/src/pages/mails/MailViewer/index.tsx`

- [ ] **Step 1: Replace the file**

Replace the entire contents of `frontend/src/pages/mails/MailViewer/index.tsx` with:

```tsx
import { useEffect, useState } from 'react';

import { ThunderboltOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import useSWR from 'swr';

import MailViewer from './MailViewer';
import SummarizeMail from './SummarizeMail';
import * as api from '../../../api/Mail';
import type { IEmailFullData } from '../../../common/types';
import Loader from '../../../components/Loader';
import { useThemeMode } from '../../../hooks/useThemeMode';
import ComposerSheet from '../ReplyMail/ComposerSheet';
import ReplyMail from '../ReplyMail';

export default function Mail() {
  const params = useParams();
  const { colors, mode } = useThemeMode();
  const [mail, setMail] = useState<IEmailFullData | null>(null);

  const { data, isLoading } = useSWR(`/mails/${params.address}/${params.id}`, () => {
    if (!params?.id || !params?.address) return Promise.resolve({ data: null });
    return api.getMail({ param: { mail_id: params?.id || '', mail_address: params?.address || '' } });
  });

  useEffect(() => {
    setMail(data?.data);
  }, [data]);

  if (isLoading || !mail) {
    return <Loader loading={isLoading} />;
  }

  const senderLabel = mail.sender.name || mail.sender.email;

  return (
    <>
      <div style={{ width: '100%' }}>
        <div
          style={{
            marginBottom: 20,
            padding: 20,
            borderRadius: 16,
            background: colors.primaryGradient,
            boxShadow:
              mode === 'dark'
                ? '0 12px 32px rgba(99,102,241,0.25)'
                : '0 12px 32px rgba(99,102,241,0.18)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 10,
              color: '#FFFFFF',
              opacity: 0.9,
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            <ThunderboltOutlined />
            <span>AI Summary</span>
          </div>
          <SummarizeMail text={mail?.body?.plain || ''} onGradient />
        </div>

        <MailViewer mail={mail} />
      </div>

      <ComposerSheet
        recipientLabel={senderLabel}
        subject={mail.subject ? `RE: ${mail.subject}` : 'New message'}
      >
        {({ editorHeight }) => <ReplyMail receivedMail={mail} editorHeight={editorHeight} />}
      </ComposerSheet>
    </>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Lint the touched files**

Run: `cd frontend && npx eslint src/pages/mails/MailViewer/index.tsx src/pages/mails/MailViewer/SummarizeMail.tsx src/pages/mails/ReplyMail/ComposerSheet.tsx src/pages/mails/ReplyMail/UserReplyMail.tsx src/pages/mails/ReplyMail/ReplyDataInput.tsx src/pages/mails/ReplyMail/index.tsx src/components/RichTextEditor.tsx --max-warnings 0`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/mails/MailViewer/index.tsx
git commit -m "feat(frontend): hero AI summary and floating composer on single mail view"
```

---

## Task 12: Verify the build and run a manual smoke test

**Files:**
- None modified.

- [ ] **Step 1: Production build of the frontend**

Run: `cd frontend && npm run build`
Expected: build succeeds with no TypeScript errors.

- [ ] **Step 2: Start the backend**

Run (from one terminal): `cd backend && poetry run uvicorn src.main:app --reload --port 8000`
Expected: backend boots without errors.

- [ ] **Step 3: Start the frontend dev server**

Run (from another terminal): `cd frontend && npm start`
Expected: dev server compiles without errors and serves on `http://localhost:3000`.

- [ ] **Step 4: Manual smoke checklist** — open a single mail in the browser and verify:

  - The AI summary card sits **above** the email body, with a gradient background and white "AI SUMMARY" eyebrow.
  - While the summary is loading, three pulsing skeleton lines appear (no spinner).
  - The mail body renders below the summary in the normal `GlassCard`.
  - **No** right-side `Drawer` appears; **no** `FloatButton` appears.
  - A pill labeled `Reply to {sender name}…` is fixed at the bottom-right, gradient background.
  - Click the pill: a `560×640` floating sheet opens at the bottom-right with a gradient header bar showing the subject. Minimize and close buttons work.
  - Inside the composer: To / From / Subject rows are stacked with a thin theme border between them — **no white background** in dark mode, **no broken rounding** at the bottom.
  - The "Reply with AI" strip shows five tone chips: Friendly · Concise · Formal · Decline politely · Enthusiastic.
  - Click a chip: it shows a spinner; the others disable; on success the editor body is populated with an AI-drafted reply; an `↶ Undo AI draft` link appears in the strip and disappears after ~5 seconds.
  - Click `↶ Undo AI draft` (within 5s): the editor reverts to its previous state.
  - Send / Schedule dropdown still works; required-field validation still disables Send when fields are empty.
  - Toggle the theme (light ↔ dark): all composer surfaces adapt — no hardcoded white surfaces remain.

- [ ] **Step 5: Visually confirm and commit a checklist note (optional, only if anything was tweaked)**

If you needed to tweak any styling during smoke testing, commit those tweaks separately:

```bash
git add -p
git commit -m "fix(frontend): smoke-test polish for single-mail redesign"
```

If the smoke test passed without changes, no commit is needed.

---

## Self-Review Notes

- **Spec coverage** — every section in the spec is mapped to a task: §1 hero summary → Task 10 + 11, §2 floating composer → Task 9 + 11, §3 composer redesign → Task 5 + 6 + 7 + 8, §4 backend tone → Task 1 + 2 + 3, §5 API/types → Task 4 (frontend types) + the in-line tone field added in Task 7's `processMailWithAI` call.
- **No new endpoint required** — the existing `/mails/process-with-ai` accepts the new optional `tone` field via Pydantic; no `routes.py` change.
- **Type consistency** — `IProcessMailTone` enum values mirror Python enum values exactly (`FRIENDLY`, `CONCISE`, `FORMAL`, `DECLINE`, `ENTHUSIASTIC`).
- **Backwards compatibility** — `RichTextEditor` adds optional `height`/`hideToolbar` props with defaults that preserve current behavior; existing callers (`AiGenerateMail`) keep working without changes. `ReplyMail/index.tsx` exports the same default — only the prop signature gains an optional `editorHeight`.
- **Frontend tests** — the codebase currently ships zero frontend tests. Per scope this plan does not introduce a frontend test suite; verification is via type-check, lint, build, and the Task 12 smoke checklist. Backend tone behavior is covered by pytest in Tasks 2–3.
