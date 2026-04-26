import type { ReactNode } from 'react';

import { useThemeMode } from '../../hooks/useThemeMode';

interface SectionHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

export default function SectionHeader({ eyebrow, title, description, action }: SectionHeaderProps) {
  const { colors } = useThemeMode();
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: 12,
        marginBottom: 14,
      }}
    >
      <div>
        {eyebrow && (
          <div
            style={{
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: colors.primary,
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            {eyebrow}
          </div>
        )}
        <div style={{ fontSize: 18, fontWeight: 600, color: colors.text, letterSpacing: '-0.01em' }}>{title}</div>
        {description && <div style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{description}</div>}
      </div>
      {action}
    </div>
  );
}
