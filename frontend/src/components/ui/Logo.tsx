import { useThemeMode } from '../../hooks/useThemeMode';

interface LogoProps {
  collapsed?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: { mark: 28, font: 16, gap: 8 },
  md: { mark: 36, font: 20, gap: 10 },
  lg: { mark: 48, font: 28, gap: 12 },
};

export default function Logo({ collapsed = false, size = 'md' }: LogoProps) {
  const { colors } = useThemeMode();
  const s = sizes[size];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: s.gap,
        userSelect: 'none',
      }}
    >
      <div
        style={{
          width: s.mark,
          height: s.mark,
          borderRadius: 10,
          background: colors.primaryGradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          fontWeight: 700,
          fontSize: s.mark * 0.55,
          boxShadow: '0 8px 18px rgba(99,102,241,0.35)',
          flexShrink: 0,
        }}
        aria-hidden
      >
        <svg width={s.mark * 0.55} height={s.mark * 0.55} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M3 7.5C3 6.11929 4.11929 5 5.5 5H18.5C19.8807 5 21 6.11929 21 7.5V16.5C21 17.8807 19.8807 19 18.5 19H5.5C4.11929 19 3 17.8807 3 16.5V7.5Z"
            stroke="#FFFFFF"
            strokeWidth="1.6"
          />
          <path d="M4 7.5L12 13L20 7.5" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="18.5" cy="6" r="2.2" fill="#FFFFFF" />
        </svg>
      </div>
      {!collapsed && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            lineHeight: 1.1,
          }}
        >
          <span
            style={{
              fontSize: s.font,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              background: colors.primaryGradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            MailSync
          </span>
          {size !== 'sm' && (
            <span
              style={{
                fontSize: 10,
                letterSpacing: '0.18em',
                color: colors.textTertiary,
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              Inbox · Reimagined
            </span>
          )}
        </div>
      )}
    </div>
  );
}
