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
