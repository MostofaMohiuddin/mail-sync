import type { ReactNode } from 'react';

import { CalendarOutlined, MailOutlined, ThunderboltOutlined } from '@ant-design/icons';

import Logo from '../../components/ui/Logo';
import { useThemeMode } from '../../hooks/useThemeMode';
import { radius, shadow, shadowDark } from '../../themes/tokens';

const features = [
  { icon: <MailOutlined />, title: 'Unified inbox', desc: 'All your mail accounts in one place.' },
  { icon: <CalendarOutlined />, title: 'Calendar at a glance', desc: 'Events from every account, side by side.' },
  { icon: <ThunderboltOutlined />, title: 'AI assist', desc: 'Summaries and replies that save you time.' },
];

export default function AuthShell({
  children,
  eyebrow,
  headline,
  subhead,
}: {
  children: ReactNode;
  eyebrow?: string;
  headline: string;
  subhead?: string;
}) {
  const { colors, mode } = useThemeMode();
  const shadows = mode === 'dark' ? shadowDark : shadow;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: colors.appBgGradient,
      }}
    >
      {/* Left hero (hidden on small screens via media query simulated by viewport check) */}
      <div
        className="auth-hero"
        style={{
          flex: '1 1 60%',
          background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          padding: '48px 56px',
          color: '#FFFFFF',
        }}
      >
        {/* Floating orbs */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '-15%',
            right: '-10%',
            width: 480,
            height: 480,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.55), transparent 60%)',
            filter: 'blur(40px)',
            animation: 'as-float-orb 14s ease-in-out infinite',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            bottom: '-20%',
            left: '-10%',
            width: 540,
            height: 540,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6,182,212,0.4), transparent 60%)',
            filter: 'blur(50px)',
            animation: 'as-float-orb 18s ease-in-out infinite reverse',
          }}
        />

        <Logo size="lg" />

        <div style={{ marginTop: 'auto', marginBottom: 0, position: 'relative', zIndex: 1, maxWidth: 520 }}>
          {eyebrow && (
            <div
              style={{
                fontSize: 12,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                opacity: 0.7,
                marginBottom: 12,
                fontWeight: 600,
              }}
            >
              {eyebrow}
            </div>
          )}
          <h1
            style={{
              fontSize: 44,
              lineHeight: 1.1,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              margin: 0,
            }}
          >
            {headline}
          </h1>
          {subhead && (
            <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.8, marginTop: 16, maxWidth: 460 }}>{subhead}</p>
          )}

          <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {features.map(({ icon, title, desc }) => (
              <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.16)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    flexShrink: 0,
                  }}
                >
                  {icon}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
                  <div style={{ fontSize: 13, opacity: 0.7 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form card */}
      <div
        style={{
          flex: '1 1 40%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          minWidth: 360,
        }}
      >
        <div
          className="as-animate-fade-in-up"
          style={{
            width: '100%',
            maxWidth: 420,
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.xl,
            padding: 36,
            boxShadow: shadows.lg,
          }}
        >
          {children}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .auth-hero { display: none !important; }
        }
      `}</style>
    </div>
  );
}
