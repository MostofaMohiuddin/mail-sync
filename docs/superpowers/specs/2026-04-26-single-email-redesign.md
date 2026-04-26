# Single Email View + Composer Redesign

**Status:** Draft
**Date:** 2026-04-26
**Scope:** `frontend/src/pages/mails/MailViewer/`, `frontend/src/pages/mails/ReplyMail/`, `frontend/src/components/RichTextEditor.tsx`, plus a small backend extension to support tone-aware AI replies.

## Problem

The single-email page (`/mails/:address/:id`) has three concrete UX problems:

1. **AI is buried.** The AI summary card sits *below* the email body. The user reads the full email first, then discovers a summary they could have read in a quarter of the time. AI is meant to be a primary aid, not a footnote.
2. **Reply form ignores the theme.** `RichTextEditor` hardcodes `background: '#fefefe'` and `border: '1px solid #ddd'`. `ReplyDataInput` hardcodes `border: '1px solid #ddd'`. In dark mode the composer is a glaring white box.
3. **Composer rounding is broken.** `UserReplyMail` rounds only the top of the "New Mail" header (`borderRadius: '12px 12px 0 0'`). Each input row below adds a top + side border but no bottom border. The bottom of the form is a flat, unfinished edge with no consistent corner treatment.

## Goals

- Lead with AI on the mail page — summary visible before the body, with strong visual prominence.
- Replace the right-side `Drawer` reply pattern with a Gmail-style bottom-right floating sheet that doesn't shrink the mail body.
- Replace the standalone `AiReplyMail` card with **tone chips** above the composer's editor that generate a draft directly into the editor.
- Make the composer a single cohesive theme-aware card: consistent radius, theme tokens for colors, no hardcoded white.

## Non-goals

- Inbox list redesign (`AllMailBox`, `SingleMailBox`, `EmailList`).
- Conversation/thread view (current app shows a single message).
- Streaming AI output (summary and tone-generated reply both remain single-shot for now).
- Scheduling UI changes — the existing `Send / Schedule` `Dropdown.Button` is preserved unchanged.
- New tone chips beyond the five listed below.

## Design

### 1. Hero AI summary on the mail page

Restructure `MailViewer/index.tsx` so the page reads top-to-bottom as: subject → sender meta → **AI hero card** → email body.

```
┌────────────────────────────────────────────────┐
│ Subject (26pt, bold)                           │
├────────────────────────────────────────────────┤
│ [avatar] Sender name <email>          2h ago   │
│          To: receiver@example.com              │
├────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────┐   │
│ │ ⚡ AI SUMMARY                            │   │   ← gradient hero
│ │   • bullet                               │   │
│ │   • bullet                               │   │
│ │   • bullet                               │   │
│ └──────────────────────────────────────────┘   │
├────────────────────────────────────────────────┤
│ Email body (solid GlassCard)                   │
│ ...                                            │
└────────────────────────────────────────────────┘
```

Specifics:

- Hero uses `colors.primaryGradient` background (the saturated one), not `primaryGradientSoft` — it must be visually dominant.
- "AI SUMMARY" eyebrow sits inside the hero (white, 0.9 opacity, `letter-spacing: 0.18em`, 10pt) next to a `ThunderboltOutlined` glyph.
- Body text inside the hero is `#FFFFFF` at ~0.95 opacity for legibility on the gradient.
- Loading state: shimmer skeleton (3 grey lines at varying widths) instead of `Spin`, so the layout doesn't jump when the API resolves.
- The current external `SectionHeader eyebrow="AI" title="Summary"` block is removed; the hero contains its own header.
- The mail-viewer wrapper no longer applies `width: openDrawer ? '50%' : '100%'` — see §2 (the new composer floats and never shrinks the mail).

### 2. Bottom-right floating composer sheet

Replace the `Drawer` + `FloatButton` pattern in `MailViewer/index.tsx` with a Gmail-style sheet that floats at the bottom-right corner.

States:

- **Collapsed pill** (default): `~280 × 48`, fixed `bottom: 24, right: 24`, `radius.full` corners, `colors.primaryGradient` background, label "Reply to {sender name}…" + chevron-up icon. Replaces the `FloatButton`.
- **Expanded sheet**: `560 × 640`, fixed `bottom: 24, right: 24`, `radius.xl` corners, theme-aware bg (`colors.surfaceElevated`), `shadow.xl`. Internal layout: 48px header bar (subject preview + minimize − + close ×) → composer body (scrolls vertically inside). Click outside does **not** close (Gmail behavior — prevents accidental loss).
- **Minimized**: same as collapsed pill but labeled with the in-progress subject. Click to re-expand.

A new component `ReplyMail/ComposerSheet.tsx` owns this shell (open/collapsed state, header bar, positioning). Children = `<ReplyMail receivedMail={mail} />`.

### 3. Composer card redesign

Replaces today's stacked-top-borders-with-no-bottom pattern with a single cohesive card. Drawn inside `ComposerSheet`, the composer body looks like:

```
┌─────────────────────────────────────────────┐  radius.lg, colors.border, colors.surface
│ To       │ recipient@example.com            │
├──────────┼──────────────────────────────────┤
│ From     │ [select: name <email>]           │
├──────────┼──────────────────────────────────┤
│ Subject  │ RE: Subject line                 │
├──────────┴──────────────────────────────────┤
│ ✨ Reply with AI                            │
│ [Friendly] [Concise] [Formal]               │
│ [Decline politely] [Enthusiastic]           │
├─────────────────────────────────────────────┤
│                                             │
│   Editor body (theme bg, no inner border)   │
│                                             │
├─────────────────────────────────────────────┤
│ [B I U • • " <>]               [ Send ▾ ]   │
└─────────────────────────────────────────────┘
```

Component-level changes:

**`ReplyDataInput.tsx`** — rebuilt as a labeled row.
- Props gain `label: string` (e.g. `"To"`, `"Subject"`).
- Layout: a flex row with a fixed-width label cell (`72px`, color `colors.textSecondary`, font 12pt) + borderless `Input`.
- Single hairline `borderBottom: 1px solid colors.border` between rows. No side borders. No top borders. No hardcoded `#ddd`.
- Background of the row = transparent (inherits composer card `colors.surface`).

**`UserReplyMail.tsx`** — rebuilt:
- The "New Mail" eyebrow header is **removed** (the `ComposerSheet` header bar replaces it).
- Sender select moves into the labeled-row stack as a third row (`label="From"`), so To/From/Subject form one consistent block.
- Below the To/From/Subject block, a **tone-chips strip**:
  - Header text: `"✨ Reply with AI"` (12pt, `colors.textSecondary`).
  - Five chips, antd `Tag`-styled or custom pill buttons: `Friendly`, `Concise`, `Formal`, `Decline politely`, `Enthusiastic`.
  - On click: call `processMailWithAI({ message: receivedMailBody, request_type: 'REPLY', tone: <CHIP> })`. While in flight, the clicked chip shows a spinner; all chips disabled.
  - On success: replace editor content with the AI draft (parse the returned HTML into Draft.js content via `htmlToDraft` or equivalent). Also surface a small `↶ Undo AI draft` link near the chips for ~5s, restoring the previous editor state on click.
  - On error: chip returns to idle, surface a non-blocking `notification.error`.
  - **Note:** the existing `AiReplyMail` flow auto-fired a `REPLY` request as soon as the drawer opened. The new flow is **explicit** — chips only generate on click. No AI work happens until the user picks a tone.
- Tone-chips strip is only rendered when `receivedMailBody` is provided (i.e. replying to an email, not the standalone "compose new" entry-point — that path can be addressed later if needed; out of scope here).
- Send actions footer (the `Dropdown.Button` for `Send / Schedule`, plus `DatePicker` when `Schedule` is selected) is preserved as-is, but moved into a footer bar with `borderTop: 1px solid colors.border`. Footer corners round `0 0 radius.lg radius.lg`.

**`RichTextEditor.tsx`** — theme-aware, embedded.
- Remove `border: '1px solid #ddd'` and `background: '#fefefe'`.
- Use `colors.surface` (no border) so the editor sits flush inside the composer card.
- Keep `padding: '8px 12px'` and the click-to-focus behavior.
- The Draft.js `Toolbar` moves out of the editor and is rendered in the composer's footer bar (left side), so the editor area is uncluttered. The toolbar plugin can stay where it is in code; only the placement of `<Toolbar>{...}</Toolbar>` moves.
- Keep `height: 25rem` for the entry-point case but let the composer-sheet flexbox compress it so the editor fills the available space inside the sheet (use `flex: 1 1 auto; min-height: 200px;` instead of fixed `25rem` when rendered inside a sheet — accept a `height?` prop, default `'25rem'`, allow `'100%'` from the sheet).

**`AiReplyMail.tsx`** — **deleted.**

**`ReplyMail/index.tsx`** — simplified:
- Drops the `AiReplyMail` import + render.
- Just renders `<UserReplyMail receiverEmail subject receivedMailBody />` (the body is now passed through so tone chips can use it).

### 4. Backend: tone parameter

`backend/src/mails/models.py`:

```python
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

`backend/src/mails/service.py` — extend `_generate_prompt`:

```python
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

Behavior:

- For `request_type = REPLY`, when `request.tone` is provided, append `f"\n\nTone: {TONE_INSTRUCTIONS[request.tone]}"` to the existing system prompt.
- For all other request types, `tone` is ignored (no behavior change).
- When `tone` is omitted, REPLY behavior is unchanged from today.

### 5. API + types

- `frontend/src/common/types.ts` (or wherever `IProcessEmailType` lives) — add `IProcessMailTone` enum mirroring the backend.
- `frontend/src/api/Mail.ts` — extend `processMailWithAI` payload type to include optional `tone: IProcessMailTone`.
- No new endpoint, no breaking change to existing callers (summary call doesn't pass tone).

## File-level change list

**Frontend:**

- `frontend/src/pages/mails/MailViewer/index.tsx` — restructure (hero summary above body, drop `width: 50%` shrink, drop `Drawer` + `FloatButton`, render new `ComposerSheet`).
- `frontend/src/pages/mails/MailViewer/SummarizeMail.tsx` — shimmer skeleton, on-gradient white text.
- `frontend/src/pages/mails/ReplyMail/index.tsx` — drop `AiReplyMail`, pass `receivedMailBody` through.
- `frontend/src/pages/mails/ReplyMail/UserReplyMail.tsx` — labeled-row inputs, tone chips, footer-bar with toolbar + send button, theme tokens, no hardcoded colors.
- `frontend/src/pages/mails/ReplyMail/ReplyDataInput.tsx` — `label` prop, theme-aware borderless row.
- `frontend/src/pages/mails/ReplyMail/AiReplyMail.tsx` — **deleted**.
- `frontend/src/pages/mails/ReplyMail/ComposerSheet.tsx` — **new**: floating sheet shell (collapsed pill / expanded card / minimized states, header bar).
- `frontend/src/components/RichTextEditor.tsx` — theme tokens, configurable height, toolbar rendered externally.
- `frontend/src/api/Mail.ts` — extend `processMailWithAI` request type.
- `frontend/src/common/types.ts` — add `IProcessMailTone`.

**Backend:**

- `backend/src/mails/models.py` — `ProcessMailWithAIRequestTone` enum, optional `tone` on request body.
- `backend/src/mails/service.py` — `TONE_INSTRUCTIONS` map, prompt extension for `REPLY` when tone provided.

## Risks and edge cases

- **Draft.js HTML import.** Today the codebase uses `stateToHTML` (export only). Loading AI-generated HTML back into the editor for tone chips needs a converter (`htmlToDraft` from `html-to-draftjs`, or `DraftPasteProcessor.processHTML` from `draft-js`). Pick one in the implementation plan; verify it round-trips the `<div>`-per-line format the backend produces.
- **Editor focus on draft injection.** After replacing editor content with an AI draft, place the cursor at the end and focus the editor so the user can edit immediately.
- **Sheet z-index.** The floating sheet must sit above antd `Modal`/`Drawer` defaults (`z-index: 1000`). Use `z-index: 1010` or pull from antd's token system.
- **Sheet clipping on small viewports.** Below ~640px viewport height, the expanded sheet should cap at `height: calc(100vh - 48px)` and the body scrolls.
- **No streaming on tone generation.** The user accepted single-shot for v1 — but the chip-active spinner can feel slow on long replies. If feedback shows it's a problem, streaming is a follow-up.
- **Existing `AllMailBox` / `SingleMailBox` and the `compose new` entry path** still import `RichTextEditor` and `UserReplyMail`. Verify those callers still work after the prop changes (specifically, `RichTextEditor` gaining a `height?` prop with a default keeps it backwards-compatible; `ReplyDataInput` gaining a required `label` prop is a breaking call-site change — every caller must pass `label`).

## Open items

None at design time. The following were considered and explicitly accepted by the user:

- 5 tone chips: Friendly / Concise / Formal / Decline politely / Enthusiastic.
- Bottom-right sheet sized 560 × 640.
- `AiReplyMail` deleted (not co-existing with chips).

## Out of scope (re-stated for clarity)

- Inbox list pages.
- Conversation threading.
- AI streaming.
- Schedule UI.
- The standalone "compose new mail" entry-point's UI (it shares `UserReplyMail` and will inherit theme/rounding fixes for free, but the tone-chips strip is suppressed when there is no `receivedMailBody`).
