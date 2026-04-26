import { Input } from 'antd';

import { useThemeMode } from '../../../hooks/useThemeMode';

interface ReplyDataInputProps {
  label: string;
  value: string;
  setValue: (value: string) => void;
  placeholder?: string;
}

export default function ReplyDataInput({ label, value, setValue, placeholder }: ReplyDataInputProps) {
  const { colors } = useThemeMode();
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        borderBottom: `1px solid ${colors.border}`,
        background: 'transparent',
      }}
    >
      <span
        style={{
          width: 64,
          flexShrink: 0,
          fontSize: 12,
          color: colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </span>
      <Input
        placeholder={placeholder}
        variant="borderless"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{ fontSize: '0.9rem', padding: 0, color: colors.text }}
      />
    </div>
  );
}
