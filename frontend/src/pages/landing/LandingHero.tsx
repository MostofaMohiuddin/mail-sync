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
            MailSync unifies every Gmail account, every event, and every reply into a single calm workspace — with AI
            that helps when you want it and stays out of your way when you don&apos;t.
          </p>

          <div style={{ marginTop: 32, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <Link to="/sign-up">
              <Button
                size="large"
                type="primary"
                style={{
                  background: colors.primaryGradient,
                  border: 'none',
                  fontWeight: 600,
                  height: 48,
                  paddingInline: 22,
                  fontSize: 15,
                  boxShadow: '0 12px 24px rgba(99,102,241,0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                Get started — free
                <ArrowRightOutlined />
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

          <div style={{ marginTop: 14, fontSize: 12, color: colors.textTertiary }}>No credit card. Cancel anytime.</div>
        </div>

        <div className="landing-hero-visual as-animate-fade-in-up" style={{ animationDelay: '120ms' }}>
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
