import type { ReactNode } from 'react';

import { useThemeMode } from '../../hooks/useThemeMode';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: { circle: 56, icon: 22, title: 14, desc: 12, padding: 16 },
  md: { circle: 72, icon: 28, title: 16, desc: 13, padding: 28 },
  lg: { circle: 96, icon: 36, title: 20, desc: 14, padding: 40 },
};

export default function EmptyState({ icon, title, description, action, size = 'md' }: EmptyStateProps) {
  const { colors } = useThemeMode();
  const s = sizes[size];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: s.padding,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: s.circle,
          height: s.circle,
          borderRadius: '50%',
          background: colors.primaryGradientSoft,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.primary,
          fontSize: s.icon,
          marginBottom: 14,
          boxShadow: `inset 0 0 0 1px ${colors.border}`,
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontSize: s.title,
          fontWeight: 600,
          color: colors.text,
          marginBottom: description ? 4 : 0,
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </div>
      {description && <div style={{ fontSize: s.desc, color: colors.textSecondary, maxWidth: 340 }}>{description}</div>}
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  );
}
