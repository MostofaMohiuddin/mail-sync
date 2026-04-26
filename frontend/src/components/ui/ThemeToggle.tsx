import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';

import { useThemeMode } from '../../hooks/useThemeMode';

export default function ThemeToggle() {
  const { mode, toggle, colors } = useThemeMode();
  const isDark = mode === 'dark';

  return (
    <Tooltip title={isDark ? 'Switch to light mode' : 'Switch to dark mode'} placement="bottom">
      <Button
        type="text"
        shape="circle"
        size="large"
        onClick={toggle}
        aria-label="Toggle theme"
        style={{
          color: colors.textSecondary,
          fontSize: 18,
          transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), color 200ms',
        }}
        icon={
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: isDark ? 'rotate(0deg)' : 'rotate(-12deg)',
              transition: 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {isDark ? <SunOutlined /> : <MoonOutlined />}
          </span>
        }
      />
    </Tooltip>
  );
}
