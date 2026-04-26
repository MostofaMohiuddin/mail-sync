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
