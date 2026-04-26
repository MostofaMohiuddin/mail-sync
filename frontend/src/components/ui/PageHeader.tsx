import type { ReactNode } from 'react';

import { useThemeMode } from '../../hooks/useThemeMode';

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  eyebrow?: string;
  actions?: ReactNode;
}

export default function PageHeader({ title, subtitle, eyebrow, actions }: PageHeaderProps) {
  const { colors } = useThemeMode();
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: 16,
        marginBottom: 20,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ minWidth: 0, flex: '1 1 auto' }}>
        {eyebrow && (
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: colors.primary,
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            {eyebrow}
          </div>
        )}
        <div
          style={{
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: colors.text,
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: 14,
              color: colors.textSecondary,
              marginTop: 6,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      {actions && <div style={{ flexShrink: 0 }}>{actions}</div>}
    </div>
  );
}
