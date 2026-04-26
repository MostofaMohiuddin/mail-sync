# Calendar Page Redesign

**Date:** 2026-04-27
**Scope:** `frontend/src/pages/calendar/`

## Context & motivation

The current `/calendar` route is a two-pane layout: antd's `Calendar`
component on the left for the month view, and a separate FullCalendar
`timeGridDay` instance on the right for the selected day. Issues:

- Two different calendar libraries side-by-side look inconsistent (different
  fonts, button styles, color scales).
- Neither calendar is theme-aware (the FullCalendar pane in particular ignores
  the `fullcalendar.css` overrides we already use in AutoReply, so dark mode
  looks generic).
- The event details pop in an antd `Modal` rendering a list of plain
  `<p><strong>Field:</strong> value</p>` rows — visually utilitarian.
- Events from different linked accounts are visually indistinguishable except
  by the avatar in the cell renderer.
- The cell renderer in `Calendar.tsx` returns `<>` fragments inside `.map()`
  without keys; the file carries an `eslint-disable` for unused imports.

## Design

### Layout (single FullCalendar + side details panel)

Mirror the AutoReply page pattern:

```
┌─────────────────────── PageHeader ───────────────────────┐
│ Calendar — {n} events this {month/week/day}              │
└──────────────────────────────────────────────────────────┘
┌─────── flex: 1 ────────┐  ┌──── width: 0 ↔ 440px ────┐
│   FullCalendar         │  │  EventDetails            │
│   (Month/Week/Day)     │  │  (always mounted)        │
└────────────────────────┘  └──────────────────────────┘
```

- Side details panel starts collapsed (`width: 0`); calendar uses the full
  width on load.
- Clicking an event sets `selectedEvent` and opens the panel
  (`width: 440px`).
- Panel close button collapses the panel back to `width: 0`; the most-recent
  event stays in panel state so the close-then-reopen animation reads well.
- Panel uses `position: sticky; top: 16; height: min(640px, calc(100vh - 160px))`
  so it stays in view as the user scrolls long week views.
- A `useEffect` watching `isPanelOpen` dispatches a `window.resize` event
  after 320ms (just past the 300ms width transition) so FullCalendar
  recomputes its grid — same trick used in AutoReply.

### FullCalendar setup

- Plugins: `dayGridPlugin`, `timeGridPlugin`, `interactionPlugin`.
- `initialView: 'dayGridMonth'`.
- `headerToolbar`: `left: 'prev,next today'`, `center: 'title'`,
  `right: 'dayGridMonth,timeGridWeek,timeGridDay'`.
- `buttonText`: `{ today: 'Today', month: 'Month', week: 'Week', day: 'Day' }`.
- `height: 'auto'` with a wrapping `div { minHeight: 600 }` (matches
  AutoReply).
- `editable: false`, `selectable: false` (creating events is out of scope).
- `dayMaxEvents: true`, `weekends: true`.
- `datesSet` callback updates `currentView` state and `visibleRange` for
  the dynamic subtitle and empty-state gating.

### Events

The existing `getEvents` API returns one `IEventsResponse` per linked account
(each with `email` + `events: IEvent[]`). The page already flattens them into a
single `events: IEvent[]` array with `userEmail` attached. We feed them to
FullCalendar as:

```ts
{
  id: e.id,
  title: e.title,
  start: e.start,
  end: e.end,
  backgroundColor: colorForAccount(e.userEmail),
  borderColor: colorForAccount(e.userEmail),
  textColor: '#ffffff',
  extendedProps: { event: e },
}
```

`colorForAccount(email)` (new `pages/calendar/eventColors.ts`) hashes the email
to an index into a fixed 6-color palette of readable mid-saturation colors:

```ts
const PALETTE = ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
export const colorForAccount = (email: string): string => {
  let h = 0;
  for (let i = 0; i < email.length; i++) h = email.charCodeAt(i) + ((h << 5) - h);
  return PALETTE[Math.abs(h) % PALETTE.length];
};
```

Same email always gets the same color. This is more readable than
`generateRandomColor` (which produces arbitrary hex strings).

### Event cell renderer

`eventContent` renders the event title in 12px semibold; in `timeGridWeek` /
`timeGridDay` views, also shows the start–end time in a smaller, lower-opacity
line. Truncates to one line with ellipsis. The colored background already
indicates which account.

### Empty state

When `events.length === 0` AND `currentView === 'dayGridMonth'`, show an
absolutely-positioned hint over the grid (same pattern as AutoReply):

> "No events this month."

Hidden in week/day views (where the grid is more useful even when empty).

### Side panel — `EventDetails.tsx`

Card chrome: `colors.surface` background, `colors.border`, `borderRadius: 14`,
overflow hidden, flex column.

**Header:**
- Left: small 10px square color dot in the event's account color + event title
  (semibold, ellipsis).
- Right: Close × button (calls `closePanel`).

**Body** (vertical stack of rows separated by `colors.border`):
- `CalendarOutlined` icon + date row:
  - Same day: "Mon, 27 Apr 2026" + "10:30 AM – 11:00 AM"
  - Different days: "Mon, 27 Apr 2026 10:30 AM" → "Tue, 28 Apr 2026 11:00 AM"
- `UserOutlined` icon + linked account email (the `userEmail`).
- `EnvironmentOutlined` icon + location (rendered only if non-empty).
- `FileTextOutlined` icon + description (rendered only if non-empty,
  `whiteSpace: pre-wrap` to preserve line breaks; max 6 lines then "Show
  more" toggle).
- `TeamOutlined` icon + attendees count; below it, the email list rendered
  as small chips with the existing `Avatar` (using `generateAvatarText` and
  `generateRandomColor` for consistency with the rest of the app). If
  attendees is empty, this row is omitted.
- `VideoCameraOutlined` icon + a primary `Button` linking to
  `video_conference_link` (target="_blank"). Omitted if no link.

Existing `IEvent` fields cover everything; no API changes.

### Subtitle pluralization

```ts
const subtitle = useMemo(() => {
  const n = visibleEvents.length;
  const noun = currentView === 'dayGridMonth' ? 'this month'
             : currentView === 'timeGridWeek' ? 'this week'
             : 'today';
  if (n === 0) return `No events ${noun}.`;
  if (n === 1) return `1 event ${noun}.`;
  return `${n} events ${noun}.`;
}, [visibleEvents.length, currentView]);
```

`visibleEvents` is computed from `events` filtered against the current
view's `visibleRange` (provided by the `datesSet` callback).

### Files touched

| File                                                           | Change |
|----------------------------------------------------------------|--------|
| `pages/calendar/index.tsx`                                     | Rewrite — flex split, single FullCalendar, dynamic subtitle, panel state, redraw effect |
| `pages/calendar/EventDetails.tsx`                              | NEW — side panel for one event |
| `pages/calendar/eventColors.ts`                                | NEW — `colorForAccount(email)` + 6-color palette |
| `pages/calendar/Calendar.tsx`                                  | DELETE |
| `pages/calendar/DayCalendar.tsx`                               | DELETE |
| `pages/calendar/DayView.tsx`                                   | DELETE (verify it's unused via grep before deleting) |
| `pages/calendar/FullCalendar.tsx`                              | DELETE (verify it's unused via grep before deleting) |
| `pages/schedule/AutoReply/fullcalendar.css`                    | MOVE → `components/fullcalendar.css` (shared) |
| `pages/schedule/AutoReply/Calendar.tsx`                        | Update import path to the new shared CSS location |

The CSS move is so both pages can import from a neutral location instead of
one feature reaching into another.

## Out of scope

- Creating, editing, deleting, or rescheduling events.
- Multi-day "all-day" event styling improvements beyond what FullCalendar gives
  by default.
- Reminders / notifications.
- Drag-to-reschedule.
- Mobile-specific layout (`<768px`).

## Acceptance

- A single themed FullCalendar fills the calendar page; clicking an event
  opens a 440px-wide side panel with structured event details (date, account,
  location, description, attendees, video link).
- Panel close collapses smoothly without leaving a visible gap; calendar
  reclaims its row.
- Events from the same linked account share a color; different accounts use
  distinct colors from the 6-color palette.
- Page subtitle reflects the current view's visible event count and view name.
- Light / dark theme toggle restyles the calendar live (via the shared
  `fullcalendar.css`).
- `tsc`, `eslint`, `prettier` all pass on changed files.
