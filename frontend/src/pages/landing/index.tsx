import { useThemeMode } from '../../hooks/useThemeMode';

export default function Landing() {
  const { colors } = useThemeMode();
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: colors.appBgGradient,
        color: colors.text,
        fontSize: 18,
      }}
    >
      MailSync — landing coming soon.
    </div>
  );
}
