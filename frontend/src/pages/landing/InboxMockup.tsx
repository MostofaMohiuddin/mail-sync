import {
  CalendarOutlined,
  ClockCircleOutlined,
  InboxOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar } from 'antd';

import { mockMails, mockMenuItems } from './mockData';
import Logo from '../../components/ui/Logo';
import MailListItem from '../../components/ui/MailListItem';
import { useThemeMode } from '../../hooks/useThemeMode';
import { radius, shadow, shadowDark } from '../../themes/tokens';

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
    <div
      className="inbox-mockup-wrapper"
      style={{ position: 'relative', width: '100%', maxWidth: '100%', minWidth: 0 }}
    >
      <div className="inbox-mockup-tilt" style={{ position: 'relative', minWidth: 0 }}>
        {/* Floating AI assist pill — sits above the frame and tilts with it */}
        <div
          className="inbox-mockup-pill"
          style={{
            position: 'absolute',
            top: -34,
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
      </div>

      <style>{`
        @media (min-width: 1100px) {
          .inbox-mockup-wrapper {
            perspective: 1400px;
          }
          .inbox-mockup-tilt {
            transform: rotateY(-4deg) rotateX(2deg);
            transform-style: preserve-3d;
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
