# Public Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a logged-out visitor opens `/`, render a beautiful Aurora-Glass marketing landing page (nav + hero with stylized inbox mockup + how-it-works + features + FAQ + CTA + footer) instead of redirecting to `/sign-in`. Authenticated users continue to see the existing dashboard at `/`, unchanged.

**Architecture:** A new `RootGate` component branches on auth state at the `/` route — authenticated users get the existing `<Layout><Home /></Layout>`, logged-out users get a new `<Landing />` page. The landing page lives at `frontend/src/pages/landing/` with one section per file. Reuses existing design tokens, `Logo`, `GlassCard`, `MailListItem`, `ThemeToggle`, and the existing `as-float-orb` / `as-pulse-glow` / `as-animate-fade-in-up` keyframes from `index.css`. No backend, no API, no new dependencies.

**Tech Stack:** React 18, TypeScript, antd v5, react-router v6, SWR (already in app), inline styles via `useThemeMode().colors` (matches existing convention).

---

## Verification Notes (no test infrastructure)

The frontend has no Jest/RTL tests written; CRA's `npm test` setup exists but is unused. Per the existing redesign spec, verification is:

- `npm run lint` passes
- `npm run build` succeeds (TypeScript compiles)
- `npm start` (dev server) — visually inspect the route in a browser

For each component task, the verification step is: dev server is running, navigate to `/` while logged out, the new section appears as described. Use the browser **without** an `access_token` in localStorage (open DevTools → Application → Local Storage → delete `access_token` and `refresh_token`, then reload).

The dev server runs on port 3000. If it's not running, start it with `npm start` from `frontend/`. Leave it running across tasks — CRA hot-reloads.

---

## Reference Knowledge

The plan repeatedly references these existing facts. Do not re-research them.

**`useThemeMode().colors` (Palette)** has these fields used here: `primary`, `primaryHover`, `primaryGradient`, `primaryGradientSoft`, `accent`, `success`, `warning`, `info`, `appBg`, `appBgGradient`, `surface`, `surfaceMuted`, `border`, `text`, `textSecondary`, `textTertiary`, `glassBg`, `glassBorder`. The hook also returns `mode: 'light' | 'dark'` and `toggle()`.

**`useSession().isAuthenticated`** is a synchronous boolean from React context. `SessionProvider` only blocks rendering with a `Loader` when `isUserLoading || isLinkMailAddressLoading` — both are gated on `hasAccessToken` (`!!localStorage.getItem('access_token')`). Logged-out visitors have no token, so neither SWR call fires and the gate is non-blocking. Safe to render `<Landing />` synchronously.

**`MailListItem` props** (from `frontend/src/components/ui/MailListItem.tsx`):
```ts
interface MailListItemProps {
  sender: string;
  subject: string;
  snippet: string;
  date: string;        // ISO string
  receiver: string;
  unread?: boolean;    // defaults false
  onClick?: () => void;
  trailing?: ReactNode;
}
```
The component renders an avatar with `generateAvatarText(sender)` colored via `generateRandomColor(sender)`. When `unread` is true: a 4px primary-gradient accent bar appears on the left, the avatar gets a primary ring, and the row background switches to `primaryGradientSoft`.

**`IEmailMetadata`** (from `frontend/src/common/types.tsx`):
```ts
{ sender: { email, name }, subject, date, snippet, receiver: { email, name }, id }
```
There is **no** `unread` field on the type. `MailListItem` accepts `unread` as a separate prop. The mockup will pass `unread` directly.

**Existing keyframes (defined in `frontend/src/index.css`):** `as-fade-in-up`, `as-fade-in`, `as-pulse-glow`, `as-shimmer`, `as-float-orb`. CSS classes `as-animate-fade-in-up`, `as-animate-fade-in`, `as-glass`, `as-mail-row` are also globally defined.

**Logo component** at `frontend/src/components/ui/Logo.tsx` accepts `size?: 'sm' | 'md' | 'lg'` and `collapsed?: boolean`. Renders the gradient envelope mark + "MailSync" wordmark.

**ThemeToggle** at `frontend/src/components/ui/ThemeToggle.tsx` is a self-contained button. Just drop it in.

**GlassCard** at `frontend/src/components/ui/GlassCard.tsx` accepts `variant?: 'glass' | 'solid'`, `padding?: number`, `hoverable?: boolean`, plus standard antd Card props.

---

## File Structure

### New files
```
frontend/src/components/auth/RootGate.tsx       # Auth-branching gate at /
frontend/src/pages/landing/index.tsx            # Composes all sections
frontend/src/pages/landing/LandingNav.tsx       # Sticky top nav
frontend/src/pages/landing/LandingHero.tsx      # Hero with text + mockup slot
frontend/src/pages/landing/InboxMockup.tsx      # Stylized fake inbox
frontend/src/pages/landing/HowItWorks.tsx       # 3-step walkthrough
frontend/src/pages/landing/FeatureGrid.tsx      # 6 feature cards
frontend/src/pages/landing/LandingFAQ.tsx       # 5 FAQ items (antd Collapse)
frontend/src/pages/landing/CTABand.tsx          # Final gradient CTA strip
frontend/src/pages/landing/LandingFooter.tsx    # Brand mark + © line + 3 links
frontend/src/pages/landing/mockData.ts          # Hardcoded mails for InboxMockup
```

### Modified files
```
frontend/src/App.tsx                            # / uses RootGate; other routes unchanged
```

---

## Task 1: Scaffold Landing placeholder, RootGate, and route

**Goal:** Get the routing change in first with a placeholder page so we can verify the gate works before building any UI. End state: logged-out `/` shows a centered "MailSync — landing coming soon" placeholder; logged-in `/` shows the existing dashboard.

**Files:**
- Create: `frontend/src/pages/landing/index.tsx`
- Create: `frontend/src/components/auth/RootGate.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1.1: Create the placeholder Landing**

Create `frontend/src/pages/landing/index.tsx`:

```tsx
import { useThemeMode } from '../../hooks/useThemeMode';

export default function Landing() {
  const { colors } = useThemeMode();
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: colors.appBgGradient,
        color: colors.text,
        fontSize: 18,
      }}
    >
      MailSync — landing coming soon.
    </div>
  );
}
```

- [ ] **Step 1.2: Create RootGate**

Create `frontend/src/components/auth/RootGate.tsx`:

```tsx
import Layout from '../layout';
import { useSession } from '../../hooks/userSession';
import Home from '../../pages/home';
import Landing from '../../pages/landing';

export const RootGate = () => {
  const { isAuthenticated } = useSession();
  if (isAuthenticated) {
    return (
      <Layout title="Home">
        <Home />
      </Layout>
    );
  }
  return <Landing />;
};
```

- [ ] **Step 1.3: Wire RootGate into App.tsx**

Modify `frontend/src/App.tsx`. Replace the `<Routes>` block. Full new contents of `App.tsx`:

```tsx
import { ConfigProvider, App as AntApp } from 'antd';
import { Route, Routes } from 'react-router-dom';
import { SWRConfig } from 'swr';

import { RequireAuth } from './components/auth';
import { RootGate } from './components/auth/RootGate';
import Layout from './components/layout';
import { SessionProvider } from './hooks/userSession';
import { ThemeModeProvider, useThemeMode } from './hooks/useThemeMode';
import SignIn from './pages/sign-in';
import SignUp from './pages/sign-up';
import routes from './routes';
import { darkTheme, lightTheme } from './themes/Theme';

function ThemedApp() {
  const { mode } = useThemeMode();
  return (
    <ConfigProvider theme={mode === 'dark' ? darkTheme : lightTheme}>
      <AntApp>
        <SWRConfig
          value={{
            revalidateIfStale: false,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            shouldRetryOnError: false,
          }}
        >
          <SessionProvider>
            <Routes>
              {/* `/` is gated separately so logged-out visitors see the landing page */}
              <Route path="/" element={<RootGate />} />
              {routes
                .filter(({ path }) => path !== '/')
                .map(({ path, component, title }) => (
                  <Route element={<RequireAuth />} key={path} path={path}>
                    <Route element={<Layout title={title}>{component}</Layout>} path="" />
                  </Route>
                ))}
              <Route path="/sign-in" element={<SignIn />} />
              <Route path="/sign-up" element={<SignUp />} />
            </Routes>
          </SessionProvider>
        </SWRConfig>
      </AntApp>
    </ConfigProvider>
  );
}

export default function App() {
  return (
    <ThemeModeProvider>
      <ThemedApp />
    </ThemeModeProvider>
  );
}
```

- [ ] **Step 1.4: Verify lint + build**

Run from `frontend/`:

```bash
npm run lint && npm run build
```

Expected: both succeed with no errors. (Build may print warnings about asset sizes — those are pre-existing and not related.)

- [ ] **Step 1.5: Verify in browser (logged-out)**

Start the dev server if not running: `npm start` from `frontend/`. In the browser:
1. Open DevTools → Application → Local Storage → delete `access_token` and `refresh_token`.
2. Navigate to `http://localhost:3000/`.
3. Expected: page renders the centered "MailSync — landing coming soon." text. NO redirect to `/sign-in`.

- [ ] **Step 1.6: Verify in browser (logged-in)**

1. Sign in via `/sign-in`.
2. After redirect, you should land on `/` and see the existing dashboard inside the existing app `<Layout>` (sidebar + header).
3. Expected: dashboard looks identical to before — greeting hero, stats row, recent mail, agenda, scheduled, quick actions.

- [ ] **Step 1.7: Commit**

```bash
git add frontend/src/pages/landing/index.tsx \
        frontend/src/components/auth/RootGate.tsx \
        frontend/src/App.tsx
git commit -m "feat(frontend): gate / by auth, render placeholder landing for logged-out"
```

---

## Task 2: Mock data for the inbox preview

**Goal:** Hardcoded fake mails the InboxMockup will render. Pure data, no UI yet, no commit visible to the user.

**Files:**
- Create: `frontend/src/pages/landing/mockData.ts`

- [ ] **Step 2.1: Create mockData.ts**

Create `frontend/src/pages/landing/mockData.ts`:

```ts
import type { IEmailMetadata } from '../../common/types';

// Dates are computed once at module load so they look "live" relative to now.
// Static enough not to cause hydration weirdness — the landing isn't SSR'd.
const now = Date.now();
const minutesAgo = (m: number) => new Date(now - m * 60_000).toISOString();
const hoursAgo = (h: number) => new Date(now - h * 3_600_000).toISOString();

export interface MockMail extends IEmailMetadata {
  unread: boolean;
}

export const mockMails: MockMail[] = [
  {
    id: 'mock-1',
    sender: { name: 'Alex Rivera', email: 'alex@figma.com' },
    receiver: { name: 'You', email: 'you@gmail.com' },
    subject: 'Design review notes — landing v3',
    snippet: 'Loved the new hero section. A couple of small tweaks before we ship…',
    date: minutesAgo(8),
    unread: true,
  },
  {
    id: 'mock-2',
    sender: { name: 'GitHub', email: 'noreply@github.com' },
    receiver: { name: 'You', email: 'you@gmail.com' },
    subject: '[mail-sync] PR #142 ready for review',
    snippet: 'Aurora Glass UI redesign — adds dark mode and refreshes every page.',
    date: minutesAgo(42),
    unread: false,
  },
  {
    id: 'mock-3',
    sender: { name: 'Priya Nair', email: 'priya@stripe.com' },
    receiver: { name: 'You', email: 'work@gmail.com' },
    subject: 'Quick sync tomorrow?',
    snippet: 'Want to walk through the Q2 plan before the all-hands. 30 min works.',
    date: hoursAgo(3),
    unread: false,
  },
  {
    id: 'mock-4',
    sender: { name: 'Linear', email: 'updates@linear.app' },
    receiver: { name: 'You', email: 'you@gmail.com' },
    subject: 'Your weekly summary is ready',
    snippet: '12 issues completed, 3 in review, 5 new. Velocity is up 18% this week.',
    date: hoursAgo(7),
    unread: false,
  },
];

export const mockMenuItems = [
  { key: 'inbox', label: 'Inbox', count: 12 },
  { key: 'calendar', label: 'Calendar', count: 0 },
  { key: 'schedule', label: 'Scheduled', count: 3 },
  { key: 'profile', label: 'Profile', count: 0 },
];
```

- [ ] **Step 2.2: Verify lint**

```bash
npm run lint
```

Expected: pass. (No build needed — file isn't imported anywhere yet, but lint catches syntax issues.)

- [ ] **Step 2.3: Commit**

```bash
git add frontend/src/pages/landing/mockData.ts
git commit -m "feat(frontend): add mock data for landing inbox preview"
```

---

## Task 3: LandingNav (sticky glass top bar)

**Goal:** A sticky top nav that becomes glass-blurred after scrolling. Logo on the left, theme toggle + Sign in + Get started on the right.

**Files:**
- Create: `frontend/src/pages/landing/LandingNav.tsx`
- Modify: `frontend/src/pages/landing/index.tsx`

- [ ] **Step 3.1: Create LandingNav**

Create `frontend/src/pages/landing/LandingNav.tsx`:

```tsx
import { useEffect, useState } from 'react';

import { Button } from 'antd';
import { Link } from 'react-router-dom';

import Logo from '../../components/ui/Logo';
import ThemeToggle from '../../components/ui/ThemeToggle';
import { useThemeMode } from '../../hooks/useThemeMode';

export default function LandingNav() {
  const { colors } = useThemeMode();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 12);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={scrolled ? 'as-glass' : undefined}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 200ms ease-in-out, border-color 200ms ease-in-out',
        borderBottom: scrolled ? `1px solid ${colors.border}` : '1px solid transparent',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1200,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <Link to="/" style={{ display: 'inline-flex' }}>
          <Logo size="md" />
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ThemeToggle />
          <Link to="/sign-in">
            <Button type="text" style={{ fontWeight: 600, color: colors.text }}>
              Sign in
            </Button>
          </Link>
          <Link to="/sign-up">
            <Button
              type="primary"
              style={{
                background: colors.primaryGradient,
                border: 'none',
                fontWeight: 600,
                boxShadow: '0 8px 18px rgba(99,102,241,0.32)',
              }}
            >
              Get started
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 3.2: Mount LandingNav in the Landing page**

Modify `frontend/src/pages/landing/index.tsx` — replace its full contents with:

```tsx
import { useThemeMode } from '../../hooks/useThemeMode';
import LandingNav from './LandingNav';

export default function Landing() {
  const { colors } = useThemeMode();
  return (
    <div style={{ minHeight: '100vh', background: colors.appBgGradient, color: colors.text }}>
      <LandingNav />
      <main style={{ paddingTop: 120, paddingBottom: 80, textAlign: 'center', color: colors.textSecondary }}>
        Sections coming next…
      </main>
    </div>
  );
}
```

- [ ] **Step 3.3: Verify lint + build**

```bash
npm run lint && npm run build
```

Expected: both pass.

- [ ] **Step 3.4: Verify in browser**

Logged out, hit `/`:
1. Top bar is visible with Logo on the left, theme toggle + "Sign in" + "Get started" on the right.
2. At scroll position 0, the bar is transparent.
3. Scroll down even slightly — the bar gets a glass blur background and a thin bottom border.
4. Theme toggle switches the page between light and dark; nav respects it.
5. Clicking "Sign in" goes to `/sign-in`. Clicking "Get started" goes to `/sign-up`. Clicking the Logo stays on `/`.

- [ ] **Step 3.5: Commit**

```bash
git add frontend/src/pages/landing/LandingNav.tsx frontend/src/pages/landing/index.tsx
git commit -m "feat(frontend): landing nav with sticky glass on scroll"
```

---

## Task 4: LandingHero (text column + mockup slot)

**Goal:** Two-column hero with eyebrow / headline (gradient highlight on last phrase) / subhead / two CTAs / fine-print line on the left, and a placeholder for the mockup on the right. Animated background orbs. Responsive: stacks on <md.

**Files:**
- Create: `frontend/src/pages/landing/LandingHero.tsx`
- Modify: `frontend/src/pages/landing/index.tsx`

- [ ] **Step 4.1: Create LandingHero**

Create `frontend/src/pages/landing/LandingHero.tsx`:

```tsx
import type { ReactNode } from 'react';

import { ArrowRightOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { Link } from 'react-router-dom';

import { useThemeMode } from '../../hooks/useThemeMode';

interface LandingHeroProps {
  visual?: ReactNode;
}

export default function LandingHero({ visual }: LandingHeroProps) {
  const { colors } = useThemeMode();

  return (
    <section
      className="landing-hero"
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '140px 24px 96px',
      }}
    >
      {/* Floating orbs */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: 520,
          height: 520,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.30), transparent 60%)',
          filter: 'blur(50px)',
          animation: 'as-float-orb 16s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          bottom: '-30%',
          left: '-10%',
          width: 540,
          height: 540,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.22), transparent 60%)',
          filter: 'blur(60px)',
          animation: 'as-float-orb 22s ease-in-out infinite reverse',
          pointerEvents: 'none',
        }}
      />

      <div
        className="landing-hero-grid"
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.1fr)',
          gap: 56,
          alignItems: 'center',
        }}
      >
        <div className="as-animate-fade-in-up">
          <div
            style={{
              fontSize: 12,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: colors.primary,
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            MailSync
          </div>
          <h1
            className="landing-hero-h1"
            style={{
              margin: 0,
              fontSize: 56,
              lineHeight: 1.05,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: colors.text,
            }}
          >
            Your mail. Your calendar.{' '}
            <span
              style={{
                backgroundImage: colors.primaryGradient,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                WebkitTextFillColor: 'transparent',
              }}
            >
              One beautiful inbox.
            </span>
          </h1>
          <p
            style={{
              margin: '20px 0 0',
              fontSize: 18,
              lineHeight: 1.55,
              color: colors.textSecondary,
              maxWidth: 520,
            }}
          >
            MailSync unifies every Gmail account, every event, and every reply into a single calm
            workspace — with AI that helps when you want it and stays out of your way when you
            don&apos;t.
          </p>

          <div style={{ marginTop: 32, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <Link to="/sign-up">
              <Button
                size="large"
                type="primary"
                icon={<ArrowRightOutlined />}
                iconPosition="end"
                style={{
                  background: colors.primaryGradient,
                  border: 'none',
                  fontWeight: 600,
                  height: 48,
                  paddingInline: 22,
                  fontSize: 15,
                  boxShadow: '0 12px 24px rgba(99,102,241,0.35)',
                }}
              >
                Get started — free
              </Button>
            </Link>
            <Link to="/sign-in">
              <Button
                size="large"
                style={{
                  height: 48,
                  paddingInline: 22,
                  fontSize: 15,
                  fontWeight: 600,
                  background: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                }}
              >
                Sign in
              </Button>
            </Link>
          </div>

          <div style={{ marginTop: 14, fontSize: 12, color: colors.textTertiary }}>
            No credit card. Cancel anytime.
          </div>
        </div>

        <div
          className="landing-hero-visual as-animate-fade-in-up"
          style={{ animationDelay: '120ms' }}
        >
          {visual ?? (
            <div
              style={{
                height: 380,
                borderRadius: 16,
                background: colors.surfaceMuted,
                border: `1px dashed ${colors.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.textTertiary,
                fontSize: 13,
              }}
            >
              (Inbox preview goes here)
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .landing-hero-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
          .landing-hero-h1 {
            font-size: 40px !important;
          }
        }
        @media (max-width: 540px) {
          .landing-hero-h1 {
            font-size: 32px !important;
          }
        }
      `}</style>
    </section>
  );
}
```

- [ ] **Step 4.2: Mount LandingHero**

Modify `frontend/src/pages/landing/index.tsx`:

```tsx
import { useThemeMode } from '../../hooks/useThemeMode';
import LandingHero from './LandingHero';
import LandingNav from './LandingNav';

export default function Landing() {
  const { colors } = useThemeMode();
  return (
    <div style={{ minHeight: '100vh', background: colors.appBgGradient, color: colors.text }}>
      <LandingNav />
      <main>
        <LandingHero />
      </main>
    </div>
  );
}
```

- [ ] **Step 4.3: Verify lint + build**

```bash
npm run lint && npm run build
```

Expected: both pass.

- [ ] **Step 4.4: Verify in browser**

Logged out at `/`:
1. Hero is visible below the nav. Two columns ≥900px: text on the left, dashed-border placeholder on the right.
2. Headline "Your mail. Your calendar. **One beautiful inbox.**" — last phrase is rendered with the indigo→violet gradient.
3. Two CTAs: gradient "Get started — free" with arrow → `/sign-up`; ghost "Sign in" → `/sign-in`.
4. Background has two soft animated orbs (violet top-right, cyan bottom-left).
5. Resize the window to <900px: columns stack, headline shrinks to 40px; <540px: 32px.
6. Theme toggle still works; gradient text and orbs adapt.

- [ ] **Step 4.5: Commit**

```bash
git add frontend/src/pages/landing/LandingHero.tsx frontend/src/pages/landing/index.tsx
git commit -m "feat(frontend): landing hero with gradient headline and animated orbs"
```

---

## Task 5: InboxMockup

**Goal:** A stylized fake inbox in a browser-frame card, used as the hero's right-column visual. 3 inner columns on ≥lg (sidebar / list / reading), collapses gracefully on smaller screens. Floating "AI assist" pill in the top-right with `as-pulse-glow` animation.

**Files:**
- Create: `frontend/src/pages/landing/InboxMockup.tsx`
- Modify: `frontend/src/pages/landing/index.tsx`

- [ ] **Step 5.1: Create InboxMockup**

Create `frontend/src/pages/landing/InboxMockup.tsx`:

```tsx
import {
  CalendarOutlined,
  ClockCircleOutlined,
  InboxOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar } from 'antd';

import Logo from '../../components/ui/Logo';
import MailListItem from '../../components/ui/MailListItem';
import { useThemeMode } from '../../hooks/useThemeMode';
import { radius, shadow, shadowDark } from '../../themes/tokens';

import { mockMails, mockMenuItems } from './mockData';

const menuIcons: Record<string, React.ReactNode> = {
  inbox: <InboxOutlined />,
  calendar: <CalendarOutlined />,
  schedule: <ClockCircleOutlined />,
  profile: <UserOutlined />,
};

export default function InboxMockup() {
  const { colors, mode } = useThemeMode();
  const shadows = mode === 'dark' ? shadowDark : shadow;
  const activeMenu = 'inbox';

  return (
    <div className="inbox-mockup-wrapper" style={{ position: 'relative' }}>
      {/* Floating AI assist pill */}
      <div
        className="inbox-mockup-pill"
        style={{
          position: 'absolute',
          top: -16,
          right: 24,
          zIndex: 2,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          borderRadius: 999,
          background: colors.primaryGradient,
          color: '#FFFFFF',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.02em',
          boxShadow: '0 10px 24px rgba(99,102,241,0.45)',
          animation: 'as-pulse-glow 2.4s ease-in-out infinite',
        }}
      >
        <ThunderboltOutlined style={{ fontSize: 12 }} />
        AI assist
      </div>

      <div
        className="inbox-mockup-frame"
        style={{
          position: 'relative',
          borderRadius: 16,
          overflow: 'hidden',
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          boxShadow: `${shadows.lg}, 0 40px 80px rgba(99,102,241,0.18)`,
        }}
      >
        {/* Browser chrome */}
        <div
          style={{
            height: 40,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '0 14px',
            borderBottom: `1px solid ${colors.border}`,
            background: colors.surfaceMuted,
          }}
        >
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#FF5F57' }} />
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#FEBC2E' }} />
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#28C840' }} />
          </div>
          <div
            style={{
              flex: '1 1 auto',
              maxWidth: 320,
              margin: '0 auto',
              height: 22,
              borderRadius: 999,
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              color: colors.textTertiary,
              fontWeight: 500,
            }}
          >
            mailsync.app/inbox
          </div>
          <div style={{ width: 47 }} />
        </div>

        {/* App-shaped content */}
        <div className="inbox-mockup-body" style={{ display: 'flex', minHeight: 380 }}>
          {/* Mini sidebar */}
          <div
            className="inbox-mockup-sidebar"
            style={{
              width: 180,
              flexShrink: 0,
              padding: 14,
              borderRight: `1px solid ${colors.border}`,
              background: colors.surfaceMuted,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <Logo size="sm" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {mockMenuItems.map((item) => {
                const isActive = item.key === activeMenu;
                return (
                  <div
                    key={item.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 10px',
                      borderRadius: radius.md,
                      background: isActive ? colors.primaryGradientSoft : 'transparent',
                      color: isActive ? colors.primary : colors.textSecondary,
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 500,
                    }}
                  >
                    <span style={{ fontSize: 14, opacity: 0.9 }}>{menuIcons[item.key]}</span>
                    <span style={{ flex: '1 1 auto' }}>{item.label}</span>
                    {item.count > 0 && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: isActive ? colors.primary : colors.textTertiary,
                        }}
                      >
                        {item.count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mail list */}
          <div
            className="inbox-mockup-list"
            style={{
              flex: '1 1 auto',
              minWidth: 0,
              padding: 14,
              overflow: 'hidden',
            }}
          >
            <div style={{ pointerEvents: 'none' }}>
              {mockMails.map((mail) => (
                <MailListItem
                  key={mail.id}
                  sender={mail.sender.name || mail.sender.email}
                  subject={mail.subject}
                  snippet={mail.snippet}
                  date={mail.date}
                  receiver={mail.receiver.email}
                  unread={mail.unread}
                />
              ))}
            </div>
          </div>

          {/* Reading pane */}
          <div
            className="inbox-mockup-reader"
            style={{
              width: 260,
              flexShrink: 0,
              padding: 16,
              borderLeft: `1px solid ${colors.border}`,
              background: colors.surface,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar size={32} style={{ backgroundColor: '#6366F1', fontSize: 12, fontWeight: 600 }}>
                AR
              </Avatar>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: colors.text,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  Alex Rivera
                </div>
                <div style={{ fontSize: 10, color: colors.textTertiary }}>alex@figma.com</div>
              </div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.text, lineHeight: 1.3 }}>
              Design review notes — landing v3
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: colors.textSecondary,
                lineHeight: 1.55,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div>Loved the new hero section — feels much more product-led now.</div>
              <div>A couple of small tweaks before we ship the marketing page…</div>
              <div style={{ color: colors.textTertiary }}>1. Tighten the CTA copy.</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .inbox-mockup-wrapper {
          transform-style: preserve-3d;
        }
        @media (min-width: 1100px) {
          .inbox-mockup-frame {
            transform: perspective(1400px) rotateY(-4deg) rotateX(2deg);
            transition: transform 600ms cubic-bezier(0.16, 1, 0.3, 1);
          }
        }
        @media (max-width: 900px) {
          .inbox-mockup-reader { display: none !important; }
        }
        @media (max-width: 640px) {
          .inbox-mockup-sidebar { display: none !important; }
        }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 5.2: Pass InboxMockup as the hero visual**

Modify `frontend/src/pages/landing/index.tsx`:

```tsx
import { useThemeMode } from '../../hooks/useThemeMode';
import InboxMockup from './InboxMockup';
import LandingHero from './LandingHero';
import LandingNav from './LandingNav';

export default function Landing() {
  const { colors } = useThemeMode();
  return (
    <div style={{ minHeight: '100vh', background: colors.appBgGradient, color: colors.text }}>
      <LandingNav />
      <main>
        <LandingHero visual={<InboxMockup />} />
      </main>
    </div>
  );
}
```

- [ ] **Step 5.3: Verify lint + build**

```bash
npm run lint && npm run build
```

Expected: both pass.

- [ ] **Step 5.4: Verify in browser**

Logged out at `/`:
1. Right column of the hero now shows the browser-framed mockup.
2. On ≥1100px viewport, the frame is subtly tilted in 3D.
3. Inner layout: mini sidebar (Inbox active), 4 mail rows (first marked unread with the accent bar), reading pane on the right.
4. A small gradient "AI assist" pill peeks above the top-right corner with a pulse glow.
5. Resize: <900px hides the reading pane; <640px also hides the sidebar — only the mail list remains.
6. Toggle dark mode: frame surface and inner columns adapt; mockup remains readable.

- [ ] **Step 5.5: Commit**

```bash
git add frontend/src/pages/landing/InboxMockup.tsx frontend/src/pages/landing/index.tsx
git commit -m "feat(frontend): inbox mockup as landing hero visual"
```

---

## Task 6: HowItWorks (3-step section)

**Goal:** Section header + three numbered steps in a row on ≥md, stacked on smaller screens. A horizontal gradient connector line behind the circles on ≥md.

**Files:**
- Create: `frontend/src/pages/landing/HowItWorks.tsx`
- Modify: `frontend/src/pages/landing/index.tsx`

- [ ] **Step 6.1: Create HowItWorks**

Create `frontend/src/pages/landing/HowItWorks.tsx`:

```tsx
import { LinkOutlined, SyncOutlined, ThunderboltOutlined } from '@ant-design/icons';

import { useThemeMode } from '../../hooks/useThemeMode';

const steps = [
  {
    n: 1,
    icon: <LinkOutlined />,
    title: 'Connect Gmail',
    desc: 'OAuth in one click. Your password never touches our servers.',
  },
  {
    n: 2,
    icon: <SyncOutlined />,
    title: 'Sync inbox & calendar',
    desc: 'Mail and events from every account, unified in one timeline.',
  },
  {
    n: 3,
    icon: <ThunderboltOutlined />,
    title: 'Reply with AI',
    desc: 'Draft, summarize, and schedule replies — with you in control.',
  },
];

export default function HowItWorks() {
  const { colors } = useThemeMode();

  return (
    <section style={{ padding: '96px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: colors.primary,
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            How it works
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: 36,
              lineHeight: 1.15,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: colors.text,
            }}
          >
            Three steps to a calmer inbox.
          </h2>
          <p
            style={{
              margin: '12px auto 0',
              maxWidth: 560,
              fontSize: 16,
              color: colors.textSecondary,
              lineHeight: 1.55,
            }}
          >
            From sign-up to your first AI-assisted reply in under two minutes.
          </p>
        </div>

        <div className="how-grid" style={{ position: 'relative' }}>
          {/* Connector line (visible on ≥md only via media query) */}
          <div
            aria-hidden
            className="how-connector"
            style={{
              position: 'absolute',
              top: 28,
              left: '16.66%',
              right: '16.66%',
              height: 2,
              background: `linear-gradient(to right, transparent, ${colors.primary} 20%, ${colors.accent} 80%, transparent)`,
              opacity: 0.35,
              zIndex: 0,
            }}
          />

          <div
            className="how-row"
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 32,
            }}
          >
            {steps.map((step) => (
              <div key={step.n} style={{ textAlign: 'center', padding: '0 8px' }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    margin: '0 auto 18px',
                    background: colors.primaryGradient,
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    fontWeight: 700,
                    boxShadow: '0 12px 24px rgba(99,102,241,0.32)',
                    border: `4px solid ${colors.appBg}`,
                  }}
                >
                  {step.n}
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 18,
                    fontWeight: 600,
                    color: colors.text,
                    letterSpacing: '-0.01em',
                    marginBottom: 8,
                  }}
                >
                  <span style={{ color: colors.primary, fontSize: 16 }}>{step.icon}</span>
                  {step.title}
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    color: colors.textSecondary,
                    lineHeight: 1.55,
                    maxWidth: 280,
                    marginInline: 'auto',
                  }}
                >
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .how-row {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
          .how-connector { display: none !important; }
        }
      `}</style>
    </section>
  );
}
```

- [ ] **Step 6.2: Mount HowItWorks**

Modify `frontend/src/pages/landing/index.tsx`:

```tsx
import { useThemeMode } from '../../hooks/useThemeMode';
import HowItWorks from './HowItWorks';
import InboxMockup from './InboxMockup';
import LandingHero from './LandingHero';
import LandingNav from './LandingNav';

export default function Landing() {
  const { colors } = useThemeMode();
  return (
    <div style={{ minHeight: '100vh', background: colors.appBgGradient, color: colors.text }}>
      <LandingNav />
      <main>
        <LandingHero visual={<InboxMockup />} />
        <HowItWorks />
      </main>
    </div>
  );
}
```

- [ ] **Step 6.3: Verify lint + build**

```bash
npm run lint && npm run build
```

- [ ] **Step 6.4: Verify in browser**

Logged out at `/`, scroll past the hero:
1. Section header with eyebrow "HOW IT WORKS", h2 "Three steps to a calmer inbox.", short subhead.
2. Three steps in a row on ≥768px: numbered gradient circles (1, 2, 3) with a soft horizontal gradient line behind them.
3. Each step: title with primary-tint icon to the left, description below.
4. <768px: stacks vertically, connector line hides.

- [ ] **Step 6.5: Commit**

```bash
git add frontend/src/pages/landing/HowItWorks.tsx frontend/src/pages/landing/index.tsx
git commit -m "feat(frontend): how-it-works 3-step section"
```

---

## Task 7: FeatureGrid (6 cards)

**Goal:** Section header + 6 feature cards in a 3×2 (≥1024px) / 2×3 (≥768px) / 1×6 (smaller) grid. Each card uses `<GlassCard variant="solid" hoverable>` with a gradient icon tile.

**Files:**
- Create: `frontend/src/pages/landing/FeatureGrid.tsx`
- Modify: `frontend/src/pages/landing/index.tsx`

- [ ] **Step 7.1: Create FeatureGrid**

Create `frontend/src/pages/landing/FeatureGrid.tsx`:

```tsx
import {
  BellOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  InboxOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';

import GlassCard from '../../components/ui/GlassCard';
import { useThemeMode } from '../../hooks/useThemeMode';

const features = [
  {
    icon: <InboxOutlined />,
    title: 'Unified inbox',
    desc: 'All your accounts in one beautifully organized place.',
  },
  {
    icon: <CalendarOutlined />,
    title: 'Calendar at a glance',
    desc: 'See events from every account, color-coded by source.',
  },
  {
    icon: <ThunderboltOutlined />,
    title: 'AI-powered replies',
    desc: 'Draft thoughtful responses in seconds, not minutes.',
  },
  {
    icon: <ClockCircleOutlined />,
    title: 'Smart scheduling',
    desc: 'Queue mail to send later. Set auto-replies that adapt.',
  },
  {
    icon: <BellOutlined />,
    title: 'Important highlights',
    desc: 'We surface what actually matters. The rest stays quiet.',
  },
  {
    icon: <SafetyOutlined />,
    title: 'Privacy first',
    desc: 'OAuth tokens stay encrypted. We never read your mail for ads.',
  },
];

export default function FeatureGrid() {
  const { colors } = useThemeMode();

  return (
    <section style={{ padding: '96px 24px', position: 'relative' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: colors.primary,
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            Features
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: 36,
              lineHeight: 1.15,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: colors.text,
            }}
          >
            Everything you need. Nothing you don&apos;t.
          </h2>
          <p
            style={{
              margin: '12px auto 0',
              maxWidth: 560,
              fontSize: 16,
              color: colors.textSecondary,
              lineHeight: 1.55,
            }}
          >
            A focused set of tools that actually save you time — no bloat, no dark patterns.
          </p>
        </div>

        <div
          className="feature-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 20,
          }}
        >
          {features.map((f) => (
            <GlassCard key={f.title} variant="solid" padding={24} hoverable>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: colors.primaryGradient,
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  marginBottom: 16,
                  boxShadow: '0 8px 18px rgba(99,102,241,0.32)',
                }}
              >
                {f.icon}
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: colors.text,
                  letterSpacing: '-0.01em',
                  marginBottom: 6,
                }}
              >
                {f.title}
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  color: colors.textSecondary,
                  lineHeight: 1.55,
                }}
              >
                {f.desc}
              </p>
            </GlassCard>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .feature-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .feature-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
```

- [ ] **Step 7.2: Mount FeatureGrid**

Modify `frontend/src/pages/landing/index.tsx`:

```tsx
import { useThemeMode } from '../../hooks/useThemeMode';
import FeatureGrid from './FeatureGrid';
import HowItWorks from './HowItWorks';
import InboxMockup from './InboxMockup';
import LandingHero from './LandingHero';
import LandingNav from './LandingNav';

export default function Landing() {
  const { colors } = useThemeMode();
  return (
    <div style={{ minHeight: '100vh', background: colors.appBgGradient, color: colors.text }}>
      <LandingNav />
      <main>
        <LandingHero visual={<InboxMockup />} />
        <HowItWorks />
        <FeatureGrid />
      </main>
    </div>
  );
}
```

- [ ] **Step 7.3: Verify lint + build**

```bash
npm run lint && npm run build
```

- [ ] **Step 7.4: Verify in browser**

Logged out, scroll past how-it-works:
1. Section "Features" with eyebrow + h2 "Everything you need. Nothing you don't." + subhead.
2. Six cards in a 3-wide grid on ≥1024px. Each card: gradient icon tile (top), title, description.
3. Hover on a card: subtle lift (the existing `<GlassCard hoverable>` behavior).
4. Resize: 2 columns at 1024–641, 1 column ≤640.

- [ ] **Step 7.5: Commit**

```bash
git add frontend/src/pages/landing/FeatureGrid.tsx frontend/src/pages/landing/index.tsx
git commit -m "feat(frontend): landing feature grid"
```

---

## Task 8: LandingFAQ

**Goal:** Section header + 5 collapsible FAQ items using antd `<Collapse>`. Each panel styled to match Aurora Glass.

**Files:**
- Create: `frontend/src/pages/landing/LandingFAQ.tsx`
- Modify: `frontend/src/pages/landing/index.tsx`

- [ ] **Step 8.1: Create LandingFAQ**

Create `frontend/src/pages/landing/LandingFAQ.tsx`:

```tsx
import { CaretRightOutlined } from '@ant-design/icons';
import { Collapse } from 'antd';

import { useThemeMode } from '../../hooks/useThemeMode';
import { radius } from '../../themes/tokens';

const faqs = [
  {
    q: 'Is MailSync free?',
    a: 'Yes — MailSync is free during the open beta. Pricing for paid plans will be announced before the beta ends.',
  },
  {
    q: 'Which mail providers do you support?',
    a: 'Gmail today (via Google OAuth). Outlook and Yahoo are on the roadmap.',
  },
  {
    q: 'Where is my mail stored?',
    a: 'Lightweight metadata (sender, subject, date) is cached in our database to power the inbox UI. Message bodies stay with your provider and are fetched on demand when you open a mail.',
  },
  {
    q: 'Can I use AI features without sharing my data?',
    a: 'AI features are opt-in per request. Nothing is sent to a model unless you explicitly trigger it — we never run background AI on your inbox.',
  },
  {
    q: 'How do I delete my data?',
    a: 'Disconnect any account from the Profile page and we purge cached metadata for that account immediately. Deleting your MailSync account removes everything.',
  },
];

export default function LandingFAQ() {
  const { colors } = useThemeMode();

  return (
    <section style={{ padding: '96px 24px' }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: colors.primary,
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            FAQ
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: 36,
              lineHeight: 1.15,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: colors.text,
            }}
          >
            Questions? Answers.
          </h2>
        </div>

        <Collapse
          accordion
          bordered={false}
          expandIconPosition="end"
          expandIcon={({ isActive }) => (
            <CaretRightOutlined
              rotate={isActive ? 90 : 0}
              style={{ color: colors.textSecondary, fontSize: 12 }}
            />
          )}
          style={{ background: 'transparent', display: 'flex', flexDirection: 'column', gap: 10 }}
          items={faqs.map((faq, i) => ({
            key: String(i),
            label: (
              <span style={{ fontSize: 15, fontWeight: 600, color: colors.text }}>{faq.q}</span>
            ),
            children: (
              <div style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 1.6 }}>
                {faq.a}
              </div>
            ),
            style: {
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.lg,
              overflow: 'hidden',
            },
          }))}
        />
      </div>
    </section>
  );
}
```

- [ ] **Step 8.2: Mount LandingFAQ**

Modify `frontend/src/pages/landing/index.tsx`:

```tsx
import { useThemeMode } from '../../hooks/useThemeMode';
import FeatureGrid from './FeatureGrid';
import HowItWorks from './HowItWorks';
import InboxMockup from './InboxMockup';
import LandingFAQ from './LandingFAQ';
import LandingHero from './LandingHero';
import LandingNav from './LandingNav';

export default function Landing() {
  const { colors } = useThemeMode();
  return (
    <div style={{ minHeight: '100vh', background: colors.appBgGradient, color: colors.text }}>
      <LandingNav />
      <main>
        <LandingHero visual={<InboxMockup />} />
        <HowItWorks />
        <FeatureGrid />
        <LandingFAQ />
      </main>
    </div>
  );
}
```

- [ ] **Step 8.3: Verify lint + build**

```bash
npm run lint && npm run build
```

- [ ] **Step 8.4: Verify in browser**

Logged out, scroll past features:
1. "FAQ" eyebrow + "Questions? Answers." h2.
2. Five accordion items in a vertical stack, each on a surface card with rounded border.
3. Click a question — it expands, others collapse (accordion mode).
4. Caret icon on the right rotates from 0° to 90° on expand.
5. Dark mode: cards use dark surface, text adapts.

- [ ] **Step 8.5: Commit**

```bash
git add frontend/src/pages/landing/LandingFAQ.tsx frontend/src/pages/landing/index.tsx
git commit -m "feat(frontend): landing FAQ accordion"
```

---

## Task 9: CTABand (final gradient CTA strip)

**Goal:** Full-bleed indigo→violet gradient strip with two animated orbs, centered headline + subhead + single CTA → `/sign-up`.

**Files:**
- Create: `frontend/src/pages/landing/CTABand.tsx`
- Modify: `frontend/src/pages/landing/index.tsx`

- [ ] **Step 9.1: Create CTABand**

Create `frontend/src/pages/landing/CTABand.tsx`:

```tsx
import { ArrowRightOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { Link } from 'react-router-dom';

export default function CTABand() {
  return (
    <section
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '96px 24px',
        background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)',
        color: '#FFFFFF',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '-30%',
          right: '-5%',
          width: 460,
          height: 460,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.55), transparent 60%)',
          filter: 'blur(50px)',
          animation: 'as-float-orb 16s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          bottom: '-40%',
          left: '5%',
          width: 460,
          height: 460,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.40), transparent 60%)',
          filter: 'blur(60px)',
          animation: 'as-float-orb 22s ease-in-out infinite reverse',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 900,
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 42,
            lineHeight: 1.15,
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }}
        >
          Stop juggling inboxes.
        </h2>
        <p
          style={{
            margin: '14px auto 0',
            maxWidth: 560,
            fontSize: 16,
            opacity: 0.85,
            lineHeight: 1.55,
          }}
        >
          Bring everything together in a workspace that&apos;s actually pleasant to use.
        </p>
        <div style={{ marginTop: 28 }}>
          <Link to="/sign-up">
            <Button
              size="large"
              icon={<ArrowRightOutlined />}
              iconPosition="end"
              style={{
                background: '#FFFFFF',
                color: '#312E81',
                fontWeight: 700,
                border: 'none',
                height: 50,
                paddingInline: 26,
                fontSize: 15,
                boxShadow: '0 14px 28px rgba(0,0,0,0.25)',
              }}
            >
              Get started — free
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 9.2: Mount CTABand**

Modify `frontend/src/pages/landing/index.tsx`:

```tsx
import { useThemeMode } from '../../hooks/useThemeMode';
import CTABand from './CTABand';
import FeatureGrid from './FeatureGrid';
import HowItWorks from './HowItWorks';
import InboxMockup from './InboxMockup';
import LandingFAQ from './LandingFAQ';
import LandingHero from './LandingHero';
import LandingNav from './LandingNav';

export default function Landing() {
  const { colors } = useThemeMode();
  return (
    <div style={{ minHeight: '100vh', background: colors.appBgGradient, color: colors.text }}>
      <LandingNav />
      <main>
        <LandingHero visual={<InboxMockup />} />
        <HowItWorks />
        <FeatureGrid />
        <LandingFAQ />
        <CTABand />
      </main>
    </div>
  );
}
```

- [ ] **Step 9.3: Verify lint + build**

```bash
npm run lint && npm run build
```

- [ ] **Step 9.4: Verify in browser**

Logged out, scroll past FAQ:
1. Full-width indigo→violet gradient strip with floating orbs.
2. Centered: h2 "Stop juggling inboxes." (white), subhead, single white "Get started — free" button with arrow.
3. Click the button → `/sign-up`.

- [ ] **Step 9.5: Commit**

```bash
git add frontend/src/pages/landing/CTABand.tsx frontend/src/pages/landing/index.tsx
git commit -m "feat(frontend): landing final CTA gradient band"
```

---

## Task 10: LandingFooter

**Goal:** Centered footer with brand mark, copyright, and three text links (Sign in, Sign up, GitHub placeholder).

**Files:**
- Create: `frontend/src/pages/landing/LandingFooter.tsx`
- Modify: `frontend/src/pages/landing/index.tsx`

- [ ] **Step 10.1: Create LandingFooter**

Create `frontend/src/pages/landing/LandingFooter.tsx`:

```tsx
import { Link } from 'react-router-dom';

import Logo from '../../components/ui/Logo';
import { useThemeMode } from '../../hooks/useThemeMode';

export default function LandingFooter() {
  const { colors } = useThemeMode();

  const linkStyle: React.CSSProperties = {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: 500,
    textDecoration: 'none',
    transition: 'color 150ms ease-in-out',
  };

  return (
    <footer
      style={{
        padding: '48px 24px 64px',
        borderTop: `1px solid ${colors.border}`,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
        }}
      >
        <Logo size="md" />
        <div style={{ fontSize: 13, color: colors.textTertiary }}>
          © {new Date().getFullYear()} MailSync · Crafted with care.
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          <Link to="/sign-in" style={linkStyle}>
            Sign in
          </Link>
          <Link to="/sign-up" style={linkStyle}>
            Sign up
          </Link>
          {/* GitHub link is a placeholder — real URL TBD by the team. */}
          <a href="#" style={linkStyle} onClick={(e) => e.preventDefault()}>
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 10.2: Mount LandingFooter**

Modify `frontend/src/pages/landing/index.tsx`:

```tsx
import { useThemeMode } from '../../hooks/useThemeMode';
import CTABand from './CTABand';
import FeatureGrid from './FeatureGrid';
import HowItWorks from './HowItWorks';
import InboxMockup from './InboxMockup';
import LandingFAQ from './LandingFAQ';
import LandingFooter from './LandingFooter';
import LandingHero from './LandingHero';
import LandingNav from './LandingNav';

export default function Landing() {
  const { colors } = useThemeMode();
  return (
    <div style={{ minHeight: '100vh', background: colors.appBgGradient, color: colors.text }}>
      <LandingNav />
      <main>
        <LandingHero visual={<InboxMockup />} />
        <HowItWorks />
        <FeatureGrid />
        <LandingFAQ />
        <CTABand />
      </main>
      <LandingFooter />
    </div>
  );
}
```

- [ ] **Step 10.3: Verify lint + build**

```bash
npm run lint && npm run build
```

- [ ] **Step 10.4: Verify in browser**

Logged out, scroll to bottom:
1. Footer with thin top border, centered.
2. Brand mark, "© 2026 MailSync · Crafted with care.", three links (Sign in, Sign up, GitHub).
3. Sign in / Sign up navigate to those pages. GitHub link does nothing (preventDefault).

- [ ] **Step 10.5: Commit**

```bash
git add frontend/src/pages/landing/LandingFooter.tsx frontend/src/pages/landing/index.tsx
git commit -m "feat(frontend): landing footer with brand mark and links"
```

---

## Task 11: End-to-end pass — responsive + theme + final verification

**Goal:** Walk the page top-to-bottom in both themes at four widths and confirm no breakage. Re-run lint and build one last time.

**No file changes unless this task surfaces issues.**

- [ ] **Step 11.1: Run lint and build**

```bash
npm run lint && npm run build
```

Expected: both pass with no new errors. Note: the existing build prints a "main bundle is large" warning — that pre-dates this work and is acceptable.

- [ ] **Step 11.2: Visual pass — desktop, light mode (1440px wide)**

Logged out, hit `/`. Walk the page top-to-bottom:
1. Nav: transparent at top, glass after scrolling.
2. Hero: text on the left (gradient highlight visible), tilted mockup on the right.
3. How it works: 3 steps in a row with connector line.
4. Features: 3-column grid.
5. FAQ: accordion works.
6. CTA band: gradient + orbs + button.
7. Footer: brand mark + 3 links.

- [ ] **Step 11.3: Visual pass — desktop, dark mode**

Toggle dark mode in the nav. Re-walk top-to-bottom. Look for:
- Nav glass adapts (darker tint).
- Hero gradient text still legible.
- Mockup frame uses dark surface; mail rows readable; reading pane dark.
- Step circles, feature icon tiles, FAQ panels all visible.
- CTA band unchanged (always indigo).
- Footer border visible in dark mode.

- [ ] **Step 11.4: Visual pass — tablet (768–900px)**

Resize browser to ~820px wide:
- Hero stacks (text on top, mockup below).
- Mockup hides reading pane.
- How-it-works: still 3 columns above 768px; below 768 stacks.
- Features: 2 columns.

- [ ] **Step 11.5: Visual pass — mobile (~400px)**

Resize browser to ~400px wide:
- Nav buttons still visible (may be tight; "Get started" stays as a gradient pill).
- Hero headline shrinks to 32px.
- Mockup shows only the mail list (sidebar + reading pane both hidden).
- How-it-works: stacks.
- Features: 1 column.
- FAQ: full-width.
- CTA band: button still tappable.
- No horizontal scroll on the page.

- [ ] **Step 11.6: Verify auth round-trip**

1. From logged-out `/`, click "Get started" → goes to `/sign-up`.
2. Sign up (or sign in) → redirected to `/`.
3. Now `/` shows the dashboard inside the app `<Layout>`. The landing is gone for this session.
4. Sign out from the user dropdown → redirects to `/sign-in`.
5. Manually navigate to `/` → landing appears again.

- [ ] **Step 11.7: Verify no console errors**

In DevTools console while on the landing: no red errors, no React warnings about keys / hooks / antd config.

- [ ] **Step 11.8: Final commit (only if anything was changed in this task)**

If steps 11.2–11.7 surfaced a fix, commit it:

```bash
git add -A
git commit -m "fix(frontend): landing polish from end-to-end pass"
```

If nothing needed fixing, skip this step.

---

## Self-Review Notes

Spec coverage check, performed after writing this plan:

- §1 Routing & auth branching → Task 1 (RootGate + App.tsx).
- §2 Page structure → Tasks 3–10 cover every section listed.
- §3 Inbox mockup → Task 5.
- §4 Theming → Every task pulls from `useThemeMode().colors`; Task 11 explicitly tests both modes.
- §5 Responsive breakpoints → Each component owns its own media-query `<style>` block; Task 11 verifies at four widths.
- §6 Files touched → Tasks 1–10 create exactly the files listed; App.tsx is the only modified file (Task 1).
- §7 Behavior preservation → Task 1 verifies the logged-in dashboard is unchanged.
- §8 Out of scope → Plan adds nothing beyond what's listed (no analytics, no SEO, no real screenshots).
- §10 Acceptance criteria → All eight items are exercised across the verification steps in Tasks 1–11.

Type / API consistency: `useThemeMode().colors` references match the actual `Palette` type. `MailListItem` props match its current signature. `IEmailMetadata` shape used in `mockData.ts` matches `frontend/src/common/types.tsx`.

Naming: every new file is referenced by every later task that uses it. Component names match between `import` lines and `export default` lines.

Placeholders: none — every code block is the full content the engineer types.

Spec ambiguities resolved: the `unread` field is added directly to `MockMail` (a local extension of `IEmailMetadata`) since `IEmailMetadata` doesn't include it. The mockup wraps mail rows in a `pointer-events: none` container so the cards don't trigger hover lifts inside the static frame.
