# MailSync Public Landing Page

**Date:** 2026-04-26
**Scope:** Frontend only (`frontend/` workspace). One routing tweak in `App.tsx`, one new gate component, one new `pages/landing/` directory. No backend, no API, no new dependencies, no design-token changes.
**Goal:** When a logged-out visitor opens `/`, render a beautiful Aurora-Glass marketing landing page instead of redirecting them to `/sign-in`. Authenticated users continue to see the existing dashboard at `/`, unchanged.

---

## 1. Routing & Auth Branching

Currently every route — including `/` — is wrapped in `RequireAuth`, which redirects unauthenticated users to `/sign-in`. We change only the `/` route.

### `frontend/src/components/auth/RootGate.tsx` (NEW)

```tsx
export const RootGate = () => {
  const { isAuthenticated } = useSession();
  if (isAuthenticated) {
    return <Layout title="Home"><Home /></Layout>;
  }
  return <Landing />;
};
```

- Imports `Home` from `pages/home`, `Layout` from `components/layout`, `Landing` from `pages/landing`, `useSession` from `hooks/userSession`.
- No loading / suspense state needed: `useSession` is synchronous from context (already in use across the app).

### `frontend/src/App.tsx` (UPDATE — ~6 lines)

The `/` route stops using `RequireAuth` and uses `RootGate` directly. Every other route is untouched.

```tsx
<Routes>
  <Route path="/" element={<RootGate />} />
  {routes.filter(r => r.path !== '/').map(({ path, component, title }) => (
    <Route element={<RequireAuth />} key={path} path={path}>
      <Route element={<Layout title={title}>{component}</Layout>} path="" />
    </Route>
  ))}
  <Route path="/sign-in" element={<SignIn />} />
  <Route path="/sign-up" element={<SignUp />} />
</Routes>
```

### Sign-in / sign-up flow

Unchanged. After successful sign-in the existing code calls `navigate('/')`, which now goes through `RootGate` and lands on the dashboard for the freshly-authenticated user.

---

## 2. Page Structure

Top-level component: `pages/landing/index.tsx`. Renders these sections in order, each as a small co-located component for scannability.

### Section list

| # | Section          | Component             | Notes |
|---|------------------|-----------------------|-------|
| 1 | Top nav          | `<LandingNav />`      | Sticky glass-blurred bar. |
| 2 | Hero + mockup    | `<LandingHero />`     | Two-column on ≥md, stacked on <md. |
| 3 | How it works     | `<HowItWorks />`      | 3-step horizontal walkthrough. |
| 4 | Feature grid     | `<FeatureGrid />`     | 6 cards, 3×2 on ≥md, single column on sm. |
| 5 | FAQ              | `<LandingFAQ />`      | 5 collapsible items (antd `Collapse`). |
| 6 | Final CTA band   | `<CTABand />`         | Full-bleed gradient strip with single CTA. |
| 7 | Footer           | `<LandingFooter />`   | Centered, minimal. |

### `LandingNav.tsx`

- Fixed at top, full width, `z-index: 50`.
- Background transitions between **transparent** (at `scrollY < 12`) and **glass surface** (`background: rgba(...,0.72); backdrop-filter: blur(16px)`) once scrolled. Border bottom appears with the glass state.
- Left: `<Logo size="md" />`.
- Right: `<ThemeToggle />`, "Sign in" ghost button → `/sign-in`, "Get started" gradient primary button → `/sign-up`.
- Height `64px`, horizontal padding `24/40px` (responsive), max-width `1200px` content area.
- Scroll listener: simple `useEffect` with `window.addEventListener('scroll', …)`, throttled with `requestAnimationFrame`.

### `LandingHero.tsx`

- Wrapper section, top padding `120px` (clears nav) + bottom padding `80px`, content max-width `1200px`, centered.
- CSS grid `grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr)` on ≥`md` (768px); single column on smaller.
- Background: app gradient + two animated `as-float-orb` orbs (violet top-right, cyan bottom-left), positioned absolute behind the content.
- **Left column (text):**
  - Eyebrow: `MAILSYNC` in `0.22em` tracked uppercase, primary tint, 12px.
  - h1: "Your mail. Your calendar. **One beautiful inbox.**" — bold word in primary gradient (background-clip: text). 56px on ≥lg, 44px on md, 36px on sm. `letter-spacing: -0.03em`, `line-height: 1.05`.
  - Subhead: ~1 sentence, 18px, secondary text color, max-width `520px`.
  - CTA row: "Get started — free" (gradient primary, large) + "Sign in" (ghost large). 12px gap, wraps on small screens.
  - Tiny "No credit card. Cancel anytime." line, 12px, tertiary color.
- **Right column:** `<InboxMockup />`.
- Entry animation: `as-animate-fade-in-up` on the text block, slight delay on the mockup.

### `InboxMockup.tsx`

A static, hand-built fake inbox inside a stylized browser frame.

- **Browser chrome wrapper:**
  - `border-radius: 16`, `background: surface`, `border: 1px solid border`, `box-shadow: shadow.lg + 0 40px 80px rgba(99,102,241,0.15)`.
  - Top bar: 40px tall, three traffic-light dots (red/yellow/green at 12px each), centered URL pill ("`mailsync.app/inbox`") with subtle muted background. Border-bottom in `border` token.
  - On ≥`lg`: `transform: perspective(1200px) rotateY(-3deg) rotateX(2deg)`. Removed below `lg`.
- **Inside the frame** (3-column app-like layout, scaled down):
  - **Mini sidebar** (180px wide on ≥md, hidden below): Logo + 4 mock menu items (Inbox active, Calendar, Schedule, Profile) using primary-tinted pill for active item.
  - **Mail list** (flex 1): 4 fake mail rows — reuse the **real** `<MailListItem>` component with hardcoded data from `mockData.ts`. First row marked `unread` to show the accent bar. `onClick` is a no-op (`() => {}`).
  - **Reading pane** (260px wide on ≥lg, hidden below): sender chip (avatar + name), subject line (semibold), 3 lines of placeholder body text in secondary color.
- **Floating accent badge:** a small pill in the top-right corner, slightly outside the frame, with `ThunderboltOutlined` icon + "AI assist" text. Gradient background, white text, soft `pulseGlow` keyframe animation.
- **Behind the frame:** the same orbs as the hero (positioned in the section background, not duplicated here).
- **Small-screen behavior:** below `md`, the reading pane and mini sidebar collapse so only the mail list shows. Mockup remains recognizable but lighter.

### `HowItWorks.tsx`

- Section padding `96px 24px`, content max-width `1100px`, centered.
- Section header (centered): eyebrow "HOW IT WORKS", h2 "Three steps to a calmer inbox.", short subhead.
- 3 steps in a row on ≥md (`display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px`), stacked on <md.
- Each step:
  - Numbered circle (56px, primary gradient, white bold "1"/"2"/"3", soft glow shadow).
  - Title (semibold 18px) + description (14px secondary).
  - Step icon (32px, primary tint) on the right of the title or below — small indicator that the step has a domain.
- Connector: a horizontal gradient line behind the circles on ≥md (`position: absolute`, between centers of step 1 and step 3, behind the circles, soft `linear-gradient(to right, transparent, primary 50%, transparent)`).
- Steps:
  1. **Connect Gmail** — `LinkOutlined`. "OAuth in one click. Your password never touches our servers."
  2. **Sync inbox & calendar** — `SyncOutlined`. "Mail and events from every account, unified in one timeline."
  3. **Reply with AI** — `ThunderboltOutlined`. "Draft, summarize, and schedule replies — with you in control."

### `FeatureGrid.tsx`

- Section padding `96px 24px`, content max-width `1200px`.
- Section header (centered): eyebrow "FEATURES", h2 "Everything you need. Nothing you don't.", short subhead.
- Grid: `grid-template-columns: repeat(3, 1fr)` on ≥`lg`, `repeat(2, 1fr)` on md, single column on sm. Gap 20px.
- Each card uses `<GlassCard variant="solid" padding={24} hoverable>`:
  - Icon tile (48×48, gradient background, white icon, 12px radius, soft glow shadow).
  - Title (16px semibold).
  - Description (14px secondary, 2 lines max).
- 6 features:
  1. **Unified inbox** — `InboxOutlined`. "All your accounts in one beautifully organized place."
  2. **Calendar at a glance** — `CalendarOutlined`. "See events from every account, color-coded by source."
  3. **AI-powered replies** — `ThunderboltOutlined`. "Draft thoughtful responses in seconds, not minutes."
  4. **Smart scheduling** — `ClockCircleOutlined`. "Queue mail to send later. Set auto-replies that adapt."
  5. **Important highlights** — `BellOutlined`. "We surface what actually matters. The rest stays quiet."
  6. **Privacy first** — `SafetyOutlined`. "OAuth tokens stay encrypted. We never read your mail for ads."

### `LandingFAQ.tsx`

- Section padding `96px 24px`, content max-width `820px`.
- Section header (centered): eyebrow "FAQ", h2 "Questions? Answers."
- antd `<Collapse ghost>` styled to match the app:
  - Each panel: `<GlassCard variant="solid">` styling on the panel container, semibold question, secondary-color answer when expanded.
  - Custom expand icon: chevron that rotates.
- 5 items (questions + 1–2 sentence answers):
  1. **Is MailSync free?** — Yes during the open beta.
  2. **Which providers do you support?** — Gmail today; Outlook is planned.
  3. **Where is my mail stored?** — Metadata is cached in our database; bodies stay with your provider and are fetched on demand.
  4. **Can I use AI features without sharing data?** — AI features are opt-in per request; nothing is sent to a model unless you explicitly trigger it.
  5. **How do I delete my data?** — Disconnect your account from the Profile page; we purge cached metadata immediately.

### `CTABand.tsx`

- Full-bleed (`width: 100%`), no max-width constraint on the strip itself; inner content max-width `900px`, centered.
- Padding `96px 24px`.
- Background: `linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)` (same as hero in dashboard / AuthShell).
- Two `as-float-orb` orbs in the background (violet + cyan), as in AuthShell.
- Centered text:
  - h2 "Stop juggling inboxes." (42px, white, semibold, `-0.02em`).
  - Subhead (16px, white at 80% opacity).
  - Single CTA "Get started free" — large, white background, indigo text, soft elevation shadow. `→ /sign-up`.

### `LandingFooter.tsx`

- Padding `48px 24px 64px`, content max-width `1200px`, centered.
- Stacked center-aligned:
  - `<Logo size="md" />`
  - "© 2026 MailSync · Crafted with care." in secondary color, 13px.
  - Three text links (`Sign in`, `Sign up`, `GitHub`) in a row, secondary color, hover → primary. GitHub link is a placeholder `#` — implementation should use `#` and a comment noting "real link TBD" rather than guessing a URL.

---

## 3. Mock Data

`pages/landing/mockData.ts` exports static arrays consumed by the inbox mockup. Self-contained, no imports from the live app's data layer.

```ts
export const mockMails: IEmailMetadata[] = [
  // 4 entries with id, sender { name, email }, receiver { email },
  // subject, snippet, date (ISO strings, set to "now" minus minutes/hours).
  // First entry includes `unread: true` if the type permits; otherwise
  // the unread state is passed via a separate prop on the mockup itself.
];
```

The exact `IEmailMetadata` shape is read from `frontend/src/common/types.ts` during implementation. If `unread` is not a field on that type, the mockup wraps each `<MailListItem>` and forces the `unread` prop directly (the prop already exists on `MailListItem` per the redesign spec).

---

## 4. Theming

- All sections respect light/dark mode via `useThemeMode().colors`.
- The hero, CTA band, and orbs use the same gradients and orb keyframes already defined for `AuthShell` and the dashboard hero — no new tokens, no new keyframes.
- The mockup adapts: in dark mode, the browser frame uses `surface` (dark), and the mini sidebar/reading pane use `surfaceMuted`.
- Theme toggle in the nav works the same as everywhere else.

---

## 5. Responsive Breakpoints

Reusing what the rest of the app uses (inline media queries via `<style>{`...`}</style>` blocks, since the app does not use a CSS-in-JS framework):

- **`<sm` (640px):** single column everywhere; nav CTAs collapse to "Sign in" + "Start" with reduced padding; mockup hides reading pane and sidebar; hero text 36px.
- **`md` (768px):** hero becomes two-column; feature grid becomes 2 columns.
- **`lg` (1024px):** feature grid becomes 3 columns; mockup gets the perspective tilt + reading pane.

Each section component owns its own `<style>` block at the bottom for these media queries to keep CSS co-located with the component.

---

## 6. Files Touched

### New (11 files)
- `frontend/src/components/auth/RootGate.tsx`
- `frontend/src/pages/landing/index.tsx`
- `frontend/src/pages/landing/LandingNav.tsx`
- `frontend/src/pages/landing/LandingHero.tsx`
- `frontend/src/pages/landing/InboxMockup.tsx`
- `frontend/src/pages/landing/HowItWorks.tsx`
- `frontend/src/pages/landing/FeatureGrid.tsx`
- `frontend/src/pages/landing/LandingFAQ.tsx`
- `frontend/src/pages/landing/CTABand.tsx`
- `frontend/src/pages/landing/LandingFooter.tsx`
- `frontend/src/pages/landing/mockData.ts`

### Modified (1 file)
- `frontend/src/App.tsx` — `/` route uses `RootGate` instead of `RequireAuth`. Other routes unchanged.

### Reused (no changes)
- `components/ui/Logo`, `components/ui/GlassCard`, `components/ui/MailListItem`, `components/ui/ThemeToggle`
- `themes/tokens` (radius, shadow, palette, duration, easing)
- `hooks/useThemeMode`, `hooks/userSession`
- `pages/home`, `components/layout` (rendered through `RootGate` for authenticated users)
- Keyframes `as-float-orb`, `as-animate-fade-in-up`, `pulseGlow` (already in `index.css`)

---

## 7. Behavior Preservation

- Authenticated `/` is byte-identical to today: same `Layout`, same `Home` component, same SWR keys.
- `RequireAuth` itself is unchanged.
- Sign-in success still navigates to `/`, which now lands authenticated users on the dashboard.
- All other routes keep their existing `RequireAuth` wrap. No URL changes for any existing route.
- No backend, no API, no `package.json` changes.

---

## 8. Out of Scope

- Real screenshots or marketing-team copy (placeholders are good-enough).
- Pricing page, blog, docs, customer logos.
- i18n.
- SEO / Open Graph meta tags (this is a SPA — would need a separate prerender or meta-injection story; defer).
- Analytics events on landing CTAs.
- A separate `/landing` URL.
- Mobile app store badges.

---

## 9. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Perspective tilt on the mockup looks broken on Safari/older browsers. | Apply only at `≥lg`. Provide a flat fallback. |
| Animated orbs (`backdrop-filter`, multiple radial gradients) hurt perf on low-end devices. | Limit orb count to 2 per section, all `position: absolute` and `pointer-events: none`. The animations are cheap (transform + opacity). |
| `MailListItem` reused with `onClick` no-op may show pointer/hover affordances that look "live". | Wrap each row in a `pointer-events: none` container inside the mockup so the hover lift still fires once on mount but clicks are silent. Alternative: pass a no-op `onClick` and accept the hover (probably nicer). Choose during implementation after eyeballing it. |
| FOUC between gate-render and `useSession` hydration. | `useSession` reads from React context that's already populated synchronously by `SessionProvider` on app boot — no async gap. Verified during implementation; if there *is* a brief async window, render a centered skeleton instead of flashing the landing. |
| `App.tsx` route filter (`r.path !== '/'`) is fragile if `routes.tsx` evolves. | Inline comment explaining intent. Could also pull `/` out of `routes.tsx` entirely and only define it in `App.tsx`; decide during implementation. |

---

## 10. Acceptance Criteria

1. Visiting `/` while logged out renders the landing page (no redirect).
2. Visiting `/` while logged in still renders the existing dashboard inside the existing app layout — visually unchanged.
3. The "Get started" / "Sign in" CTAs in nav, hero, and final band navigate to `/sign-up` and `/sign-in` respectively.
4. Theme toggle in the landing nav switches the entire landing between light and dark mode; preference persists.
5. Page is responsive at 1440 / 1024 / 768 / 480 — no horizontal scroll, no broken layout, mockup stays recognizable at every width.
6. No console errors. `npm run lint` passes. `npm run build` succeeds.
7. No new runtime dependencies added. No backend or API code changed.
8. All existing flows (sign in, sign up, dashboard, inbox, calendar, profile, schedule) continue to work unchanged.
