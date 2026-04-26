# Auto Reply: Layout & Calendar UX

**Date:** 2026-04-27
**Scope:** `frontend/src/pages/schedule/AutoReply/`

## Context & motivation

The Auto Reply page renders a FullCalendar that "squeezes" to 50% of its parent
when a right-side `Drawer` opens to host the create-schedule form. Two problems:

1. **Width math is broken.** The calendar wrapper is sized at `50%` of the
   *page content area* (which sits to the right of the collapsible Sider and
   inside page padding). The `Drawer` is sized at `45%` of the *viewport* and is
   `position: fixed`. The two bases never line up — there's always either a
   visible gap or the drawer overlaps the calendar, and collapsing the Sider
   makes it worse.
2. **Calendar UX is generic.** Events are unlabeled colored boxes. No
   theme-awareness (poor dark mode), no empty state, no tooltips, no hint that
   you can drag a date range to create a schedule.

## Design

### Layout — inline split

Replace the `Drawer` in `AutoReply/index.tsx` with a flex side-by-side layout.

```
┌────────────── page content area ──────────────┐
│ ┌──── flex: 1 ────┐ ┌── width: 480px ──┐ │
│ │   GlassCard     │ │  GlassCard        │ │
│ │   <Calendar />  │ │  <CreateSchedule />│ │
│ └─────────────────┘ └───────────────────┘ │
└─────────────────────────────────────────────────┘
```

- Calendar wrapper: `flex: 1, minWidth: 0`. FullCalendar resizes via its
  built-in `ResizeObserver`.
- Form panel wrapper: animates `width` between `0` and `480px` over 300ms;
  `overflow: hidden` clips the inner card while collapsed.
- Inner card has a fixed `width: 480px` so no layout reflow happens during
  the animation.
- Form is **always mounted**: closing the panel preserves Senders / When /
  Body (per user preference). Form state resets only after a successful create.
- The panel header gets a small "Close" button (replaces the Drawer chrome).

### Calendar UX

In `Calendar.tsx`:

- **Event labels.** Each event carries:
  - `title = senderEmail`
  - `extendedProps.excerpt = body.plain` (truncated to ~60 chars, first line)
  - `eventContent` renders the email in bold and the excerpt below it in
    muted small text. Renders gracefully in `dayGridMonth`,
    `timeGridWeek`, and `timeGridDay`.
- **Hover tooltip.** Antd `Tooltip` over each event:
  `From {sender} · {start} → {end}` (formatted with dayjs).
- **Empty hint.** When `schedules.length === 0`, an absolutely-positioned
  message centered over the calendar grid: "Drag any range of days to
  schedule an auto-reply." Disappears once a schedule exists.
- **Height.** Switch from `height="80vh"` to `height="auto"` and put a
  `minHeight: 600` on the wrapping GlassCard so the page doesn't double-scroll
  when the form panel is taller than the viewport.

In `index.tsx`:

- `PageHeader` subtitle becomes dynamic:
  - 0 schedules: "No active schedules — drag any range to schedule an
    auto-reply."
  - n=1: "1 active schedule — drag any range to add another."
  - n>1: "{n} active schedules — drag any range to add another."

### Theming (FullCalendar)

The existing `index.css` exposes a small set of `--as-*` vars but not the
palette colors (primary/surface/border live only in `palette[mode]`). To
avoid expanding that surface, add a single self-contained stylesheet
`frontend/src/pages/schedule/AutoReply/fullcalendar.css` that overrides
FullCalendar's `--fc-*` variables with concrete color values (matching
`palette[mode]`) under two selectors:

```css
:root[data-theme='light'] .fc {
  --fc-border-color: #e5e9f0;
  --fc-page-bg-color: #ffffff;
  --fc-neutral-bg-color: #f1f5f9;
  --fc-today-bg-color: rgba(99, 102, 241, 0.08);
  --fc-event-bg-color: #6366f1;
  --fc-event-border-color: #6366f1;
  --fc-event-text-color: #ffffff;
  --fc-button-bg-color: #ffffff;
  --fc-button-text-color: #0f172a;
  --fc-button-border-color: #e5e9f0;
  --fc-button-active-bg-color: #6366f1;
  --fc-button-active-border-color: #6366f1;
}
:root[data-theme='dark'] .fc { /* dark equivalents */ }
```

Imported once from `Calendar.tsx`. No changes to `index.css` or
`useThemeMode`.

### Files touched

| File                                                | Change                                            |
| --------------------------------------------------- | ------------------------------------------------- |
| `pages/schedule/AutoReply/index.tsx`                | Drop Drawer, add flex split, dynamic subtitle, close-panel handler |
| `pages/schedule/AutoReply/Calendar.tsx`             | Pass schedules with title+excerpt, custom `eventContent`, Tooltip, empty hint, height auto |
| `pages/schedule/AutoReply/CreateSchedule.tsx`       | Drop reset-on-close `useEffect`, accept `closePanel` prop, add header with Close + footer "Clear" link, reset only after successful create |
| `pages/schedule/AutoReply/fullcalendar.css` (new)   | Theme-bound `--fc-*` overrides                    |

## Out of scope

- Editing existing schedules (today: view + delete only).
- Drag-to-resize an existing event on the calendar.
- Recurring schedules.
- Mobile-specific layout (`<768px`).

## Acceptance

- Opening the panel shrinks the calendar smoothly with no overlap and no
  visible gap, regardless of Sider state (collapsed/expanded) or viewport
  width.
- Closing the panel without submitting and reopening shows the previous form
  contents intact.
- Events show the sender email and a body excerpt; hovering shows the full
  start/end + sender.
- An empty calendar shows the drag hint.
- Light/dark theme toggle changes calendar colors live.
- Page does not double-scroll.
