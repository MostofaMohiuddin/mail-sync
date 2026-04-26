# Aurora Glass — Mail Sync UI/UX Redesign

**Date:** 2026-04-26
**Scope:** Frontend only (`frontend/` workspace). No backend, API, or data-model changes.
**Goal:** Transform the visually generic Ant Design default into a premium, modern interface ("Aurora Glass") with a cohesive design system, dark mode, and polished page-level treatments — without altering any existing functionality.

---

## 1. Design Language

### Color Palette

| Role             | Light                                  | Dark                                  |
| ---------------- | -------------------------------------- | ------------------------------------- |
| Primary          | `#6366F1` (indigo-500)                 | `#818CF8` (indigo-400)                |
| Primary gradient | `linear-gradient(135deg,#6366F1,#8B5CF6)` | `linear-gradient(135deg,#818CF8,#A78BFA)` |
| Accent           | `#06B6D4` (cyan-500)                   | `#22D3EE` (cyan-400)                  |
| Success          | `#10B981`                              | `#34D399`                             |
| Warning          | `#F59E0B`                              | `#FBBF24`                             |
| Error            | `#EF4444`                              | `#F87171`                             |
| App background   | `#F8FAFC`                              | `#0B1020`                             |
| Surface          | `#FFFFFF`                              | `#111933`                             |
| Surface elevated | `#FFFFFF` + shadow                     | `#172044`                             |
| Border           | `#E2E8F0`                              | `#1E2A52`                             |
| Text primary     | `#0F172A`                              | `#E2E8F0`                             |
| Text secondary   | `#64748B`                              | `#94A3B8`                             |

### Typography

- **Font family:** Inter (variable, loaded from Google Fonts), fallback to system stack.
- **Scale:** `12 / 13 / 14 / 16 / 18 / 22 / 28 / 36 px`.
- **Weights:** 400 body, 500 medium, 600 semibold (headings), 700 only for hero/title.
- **Letter spacing:** `-0.01em` on headings ≥ 18px; default elsewhere.

### Surface, Radius, Shadow, Motion

- **Border radius tokens:** `sm 6, md 10, lg 14, xl 20, full 9999`.
- **Spacing tokens:** `xs 4, sm 8, md 12, lg 16, xl 24, 2xl 32, 3xl 48`.
- **Shadows:**
  - `shadow-sm`: `0 1px 2px rgba(15,23,42,0.04)`
  - `shadow-md`: `0 4px 12px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)`
  - `shadow-lg`: `0 12px 32px rgba(15,23,42,0.08), 0 4px 8px rgba(15,23,42,0.04)`
  - `shadow-glow`: `0 0 0 4px rgba(99,102,241,0.12)` (focus / unread accent)
- **Motion:** `duration-fast 150ms`, `duration-base 200ms`, `duration-slow 300ms`. Easing `cubic-bezier(0.16, 1, 0.3, 1)` for entrances; `ease-in-out` for hover.

### Glass Effect

A reusable `glass` style mix:

```
background: rgba(255,255,255,0.72);   /* dark: rgba(17,25,51,0.62) */
backdrop-filter: blur(16px) saturate(140%);
border: 1px solid rgba(255,255,255,0.6);   /* dark: rgba(255,255,255,0.06) */
```

Applied to: header bar, notification popover, sign-in card, mail viewer header chip.

---

## 2. Token & Theme Architecture

### `frontend/src/themes/tokens.ts` (NEW)

Plain TS constants, framework-agnostic. Exports:

```ts
export const radius = { sm: 6, md: 10, lg: 14, xl: 20, full: 9999 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32, '3xl': 48 };
export const shadow = { sm: '...', md: '...', lg: '...', glow: '...' };
export const duration = { fast: 150, base: 200, slow: 300 };
export const easing = { entrance: 'cubic-bezier(0.16, 1, 0.3, 1)', standard: 'ease-in-out' };
export const palette = { light: {...}, dark: {...} }; // full table from §1
```

### `frontend/src/themes/Theme.ts` (REWRITE)

Exports two `ThemeConfig`s — `lightTheme` and `darkTheme` — built from tokens. Uses antd v5 `theme.defaultAlgorithm` / `theme.darkAlgorithm` with custom token overrides (`colorPrimary`, `colorBgLayout`, `colorBgContainer`, `colorBorder`, `colorText`, `colorTextSecondary`, `borderRadius`, `borderRadiusLG`, `fontFamily`, `controlHeight`, `boxShadow`, `boxShadowSecondary`, etc.). Component-level overrides for `Menu`, `Layout`, `Button`, `Input`, `Card`, `List`, `Drawer`, `Popover`, `Modal`, `Avatar`, `Tag` to align radii and shadows.

### `frontend/src/hooks/useThemeMode.ts` (NEW)

`useThemeMode()` returns `{ mode: 'light' | 'dark', toggle, setMode }`. Persists to `localStorage('mail-sync-theme')`. Defaults to system preference via `prefers-color-scheme`.

### `frontend/src/App.tsx` (UPDATE)

Wraps everything in `<ConfigProvider theme={mode === 'dark' ? darkTheme : lightTheme}>`. Adds `<ThemeProvider>` (custom context) so deeply nested children can read mode for CSS-in-style decisions (e.g., glass background tint).

### `frontend/src/index.css` (REWRITE — minimal global)

- Loads Inter from Google Fonts (`<link>` in `public/index.html` for performance) and sets `body { font-family: 'Inter', ... }`.
- App background, smooth scrollbar styling (light + dark), text rendering hints.
- Keeps Draft.js / draft-plugins styles (existing block — preserve intact).
- Adds keyframes: `@keyframes fadeInUp`, `@keyframes shimmer`, `@keyframes pulseGlow`.
- Removes the orphaned `.ant-list-item:hover { box-shadow: 0 0 4px #eee }` (replaced by component-level styling).

### `public/index.html` (UPDATE)

Add Inter `<link rel="preconnect">` + `<link rel="stylesheet">` for `Inter:wght@400;500;600;700`.

---

## 3. Shared UI Components (NEW — `frontend/src/components/ui/`)

Each is a small, focused React component using antd primitives + the new tokens. They are the building blocks the page-level changes consume.

### `Logo.tsx`
Brand mark: gradient rounded-square with a stylized envelope/spark icon + "MailSync" wordmark. Props: `collapsed?: boolean` (icon-only when collapsed), `size?: 'sm' | 'md' | 'lg'`.

### `PageHeader.tsx`
Consistent page intro: title, optional subtitle, optional right-aligned action slot. Replaces the inline title placement and gives every page a consistent feel.

### `GlassCard.tsx`
Wrapper around antd `Card` applying the glass style + soft shadow + radius. Props: `variant?: 'glass' | 'solid'`, `padding?`, `hoverable?`.

### `EmptyState.tsx`
Replaces ad-hoc `<Empty>` usages. Props: `icon`, `title`, `description`, `action?`. Includes a soft gradient circle behind the icon.

### `ThemeToggle.tsx`
Sun/Moon icon button wired to `useThemeMode`. Animated icon swap.

### `MailListItem.tsx`
Card-based mail row replacing the current `<List.Item>` body inside `EmailList.tsx`. Features:
- Left accent bar (4px) shown when `unread`.
- Avatar with subtle ring when unread.
- Sender name + relative date (right).
- Subject (1 line, semibold) + snippet (1 line, secondary, ellipsis).
- Hover: lift (`translateY(-1px)`) + `shadow-md`.
- Hover-revealed quick actions: open, mark-read (visual only — wire up only if existing API supports it; otherwise leave as inert hover state with tooltip "Coming soon").
- Receiver email shown as a small Tag pill on hover (currently shown as plain text; this is a visual upgrade only — no behavior change).

### `StatusBadge.tsx`
Small colored pill for things like scheduled-mail status, connection status. Variants: `success | warning | error | info | neutral`.

### `SectionHeader.tsx`
Used inside complex pages (Profile, Schedule) to label sub-sections with a tiny uppercase eyebrow.

### `formatRelativeDate.ts` (utility, `frontend/src/common/`)
Returns `"just now"`, `"5m ago"`, `"3h ago"`, `"Yesterday"`, `"Mar 14"`, etc. Used by `MailListItem` and notification list. Pure function, easily unit-testable.

---

## 4. Layout Shell

### `components/layout/index.tsx`
- Sidebar: default **expanded** (`collapsed: false`), keep collapse toggle. Replace inline `LOGO` text with `<Logo />`. Apply gradient background to the sider header area; menu items use new selected style (rounded pill with primary tint at ~12% alpha, primary text color). Add a footer-pinned user chip (avatar + name + caret → opens existing user menu).
- Header: glass background, height `64px`, left side shows the page breadcrumb/title (via `<PageHeader>` slot), right side has: global search input (visual placeholder — non-functional in this scope, marked with `disabled` tooltip "Search coming soon"), `<ThemeToggle />`, notification bell, user avatar dropdown.
- Content: increase padding to `24/32px`, raise `borderRadiusLG` to `16`, switch to `shadow-md`. Add a subtle linear gradient background washing from top.
- Footer: keep but restyle — small, centered, `text-secondary`, "MailSync · Crafted with care".

### `components/layout/Header.tsx`
Refactor to consume new tokens. Notification bell:
- Animated soft `pulseGlow` when there are unread notifications.
- Popover content uses `<GlassCard>` and `<MailListItem>`-style rows.
- Add a "Mark all as read" button at top of popover (wire to existing `markImportantMailNotificationAsRead` endpoint with all unread IDs — already used on close, so behavior identical).
- Empty state replaced with `<EmptyState>`.

User avatar: add a thin gradient ring; dropdown menu items get icons aligned and a subtle hover background.

---

## 5. Page-Level Changes

### Sign In / Sign Up (`pages/sign-in/`, `pages/sign-up/`)
Split-screen layout (single component refactor — duplicated structure factored into `pages/auth/AuthShell.tsx`):
- **Left (60% on ≥md, hidden on sm)**: gradient hero (`primary → violet`), brand `<Logo size="lg" />`, headline "Your mail, beautifully unified.", three feature bullets with icons (Inbox, Calendar, AI Assist), subtle animated blur orbs in the background.
- **Right (40%)**: `<GlassCard>` with the existing form, larger inputs (`controlHeight: 44`), gradient primary button, "Or continue with" placeholder section is **NOT** added (no OAuth on the auth screens beyond the existing username/password — keep scope tight).
- Entry animation: `fadeInUp` on the card.

Functionality: untouched. Same `signIn` / `signUp` API calls, same redirects, same form fields, same validation.

### Mail List (`pages/mails/`, `components/EmailList.tsx`)
- Replace `<List>` body with rendered `<MailListItem>` cards inside the existing `<InfiniteScroll>` (keep pagination logic unchanged).
- Skeleton loader: custom skeleton matching `MailListItem` shape (avatar circle + 2 text lines).
- End message redesigned as a friendly divider with icon.
- Empty state: `<EmptyState>` ("No emails yet" with a mail icon).

`unread` flag: the existing `IEmailMetadata` type is preserved; if it has no read/unread field today, `MailListItem` accepts `unread?: boolean` defaulted to `false` — so this is purely additive and won't visually misrepresent state. (Implementation phase will check the type; if the field exists, wire it up; if not, leave default `false`.)

### Mail Viewer (`pages/mails/MailViewer/MailViewer.tsx`)
- Subject becomes a large heading (`28px` semibold).
- Sender block becomes a glass chip with avatar + name + email.
- Add a metadata row (date) right-aligned with relative time + absolute on hover (antd `Tooltip`).
- Body wrapped in a `<GlassCard padding="lg">` for visual containment; preserve `parse(mail.body.html || mail.body.plain || '')` exactly.
- No action toolbar wiring beyond what already exists in the parent — the existing reply flow via `<Drawer>` from `pages/mails/index.tsx` is unchanged.

### Compose / Reply Drawer (`pages/mails/ReplyMail/`)
- Drawer header: gradient accent strip across the top.
- Form inputs: larger height, refined labels.
- Editor toolbar styled to match new palette (Draft plugin CSS overrides scoped to `.compose-editor` to avoid breaking other Draft instances).
- Submit/AI buttons restyled with primary gradient (primary action) and ghost (secondary).

### Profile (`pages/profile/index.tsx`, `EmailAddressList.tsx`)
- Hero band: gradient background, large avatar overlapping the bottom edge, username + a small "Member since …" or just username if data unavailable.
- Stat chips row: linked accounts count, scheduled mails count (only render if data is readily available from existing hooks; otherwise omit — no new API calls).
- Linked addresses become a grid of cards (one per address): provider icon (Google/Yahoo logo from existing icons), avatar, email, status badge ("Connected"), unlink button as a subtle ghost icon button.
- "Add account" becomes a prominent dashed-border card at the end of the grid.

### Calendar (`pages/calendar/`)
- Outer flex layout preserved; both panes wrapped in `<GlassCard>`.
- Each event color-coded per linked account using a stable hash of the account email (extend the existing `generateRandomColor` utility usage; do not introduce a new randomness source).
- Day-view panel header gets a `<PageHeader>` with date subtitle.
- Loader replaced with a centered shimmer skeleton inside the cards.

### Schedule pages (`pages/schedule/`)
- `ScheduledMails`: card grid (or styled list) using `<GlassCard>` per scheduled mail with `<StatusBadge>`.
- `AutoReply`: form inside a `<GlassCard>`, larger inputs, gradient primary save button.
- Page intros via `<PageHeader>`.

### OAuth callback (`pages/oauth/`)
Light polish only — center a `<GlassCard>` with a spinner and "Linking your account…" message. No flow changes.

---

## 6. Behavior Preservation Guarantees

- All `useSWR` keys, refresh intervals, `mutate()` calls, and API endpoints remain identical.
- All routes in `routes.tsx` unchanged.
- All form fields, validation rules, and submit handlers unchanged.
- `RichTextEditor` and Draft.js integration untouched (only styled wrapper around the editor).
- `useSession` hook and notification mark-as-read flow preserved.
- No backend code is touched. No `package.json` dependencies added. (Inter font loaded via `<link>` in `index.html`.)

If any planned visual change would require a behavior or API change, that change is dropped from scope rather than altering behavior.

---

## 7. Out of Scope

- Internationalization changes.
- Mobile-specific layout (the app is desktop-first today; new components are responsive at common breakpoints but a mobile-tailored experience is a separate effort).
- Real global search functionality (header search input is visually present but disabled).
- New backend endpoints, new data fields, or schema changes.
- Animations beyond the small set defined here (no page-transition libraries, no Framer Motion).
- Replacing antd with another UI library.
- Accessibility audit beyond preserving antd's defaults (focus rings, contrast checked for the new palette).
- Storybook or component documentation site.

---

## 8. Risks & Mitigations

| Risk                                                                | Mitigation                                                                                                              |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Glass `backdrop-filter` perf on lower-end machines.                 | Apply only to small surfaces (header, popover, auth card). Solid surfaces elsewhere.                                    |
| Dark-mode contrast regressions in third-party Draft.js editor.      | Scope dark overrides to app surfaces; leave editor body white in dark mode for now, framed inside a dark card.          |
| Inter font FOUT.                                                    | `<link rel="preconnect">` + `font-display: swap` (Google default). Fallback to system stack matches metrics closely.    |
| Existing `generateRandomColor` returns inconsistent colors per render. | Verify it's stable for a given input string before relying on it for color-coded events. If not stable, fix in scope.   |
| Page width assumptions in `EmailList` (`50vw` / `25vw`).            | Replace fixed `vw` widths with flex-based layout in the new `MailListItem`.                                             |
| Hooks ordering / `ConfigProvider` placement breaking antd notifications. | Mount `ConfigProvider` at the top inside `App.tsx`, above `Routes` and `SessionProvider`, so antd `notification.*` static calls inherit theme. |

---

## 9. Acceptance Criteria

1. App renders correctly in light and dark mode; toggle persists across reloads and respects initial system preference.
2. Every page listed in §5 visibly uses the new palette, type scale, radii, and shadow tokens — no stock antd defaults remain visible.
3. Sign in and sign up render in the split-screen layout on ≥768px; on smaller viewports the form card stacks above (or replaces) the hero.
4. Notification popover, mail list, mail viewer, profile, calendar, and schedule pages all render the new components without any console errors or warnings.
5. All existing flows (sign in, sign up, link a Gmail account, view inbox, open a mail, reply, schedule auto-reply, view calendar, mark notifications read) work unchanged.
6. No TypeScript errors. `npm run lint` passes. `npm run build` succeeds.
7. No new runtime dependencies added.
