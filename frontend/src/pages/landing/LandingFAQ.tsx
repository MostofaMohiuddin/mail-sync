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
            <CaretRightOutlined rotate={isActive ? 90 : 0} style={{ color: colors.textSecondary, fontSize: 12 }} />
          )}
          style={{ background: 'transparent', display: 'flex', flexDirection: 'column', gap: 10 }}
          items={faqs.map((faq, i) => ({
            key: String(i),
            label: <span style={{ fontSize: 15, fontWeight: 600, color: colors.text }}>{faq.q}</span>,
            children: <div style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 1.6 }}>{faq.a}</div>,
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
