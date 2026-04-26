import type { CSSProperties, ReactNode } from 'react';

import { useThemeMode } from '../../hooks/useThemeMode';
import { radius, shadow, shadowDark } from '../../themes/tokens';

interface GlassCardProps {
  children: ReactNode;
  variant?: 'glass' | 'solid' | 'muted';
  padding?: number | string;
  hoverable?: boolean;
  bordered?: boolean;
  style?: CSSProperties;
  className?: string;
  onClick?: () => void;
}

export default function GlassCard({
  children,
  variant = 'solid',
  padding = 20,
  hoverable = false,
  bordered = true,
  style,
  className,
  onClick,
}: GlassCardProps) {
  const { colors, mode } = useThemeMode();
  const shadows = mode === 'dark' ? shadowDark : shadow;

  let bg: string = colors.surface;
  let border = bordered ? `1px solid ${colors.border}` : '1px solid transparent';
  if (variant === 'glass') {
    bg = colors.glassBg;
    border = bordered ? `1px solid ${colors.glassBorder}` : '1px solid transparent';
  } else if (variant === 'muted') {
    bg = colors.surfaceMuted;
  }

  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        background: bg,
        border,
        borderRadius: radius.lg,
        padding,
        boxShadow: shadows.md,
        backdropFilter: variant === 'glass' ? 'blur(16px) saturate(140%)' : undefined,
        WebkitBackdropFilter: variant === 'glass' ? 'blur(16px) saturate(140%)' : undefined,
        transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
      onMouseEnter={
        hoverable
          ? (e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = shadows.lg;
            }
          : undefined
      }
      onMouseLeave={
        hoverable
          ? (e) => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = shadows.md;
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}
