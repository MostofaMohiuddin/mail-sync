import type { ReactNode } from 'react';

import { useThemeMode } from '../../hooks/useThemeMode';

type Variant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface StatusBadgeProps {
  variant?: Variant;
  children: ReactNode;
  dot?: boolean;
}

export default function StatusBadge({ variant = 'neutral', children, dot = true }: StatusBadgeProps) {
  const { colors } = useThemeMode();

  const map: Record<Variant, { bg: string; fg: string; dot: string }> = {
    success: { bg: 'rgba(16,185,129,0.12)', fg: colors.success, dot: colors.success },
    warning: { bg: 'rgba(245,158,11,0.14)', fg: colors.warning, dot: colors.warning },
    error: { bg: 'rgba(239,68,68,0.12)', fg: colors.error, dot: colors.error },
    info: { bg: 'rgba(59,130,246,0.12)', fg: colors.info, dot: colors.info },
    neutral: { bg: colors.surfaceMuted, fg: colors.textSecondary, dot: colors.textTertiary },
  };
  const c = map[variant];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 10px',
        borderRadius: 999,
        background: c.bg,
        color: c.fg,
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
      }}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: c.dot,
            display: 'inline-block',
          }}
        />
      )}
      {children}
    </span>
  );
}
