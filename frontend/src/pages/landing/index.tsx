import LandingNav from './LandingNav';
import { useThemeMode } from '../../hooks/useThemeMode';

export default function Landing() {
  const { colors } = useThemeMode();
  return (
    <div style={{ minHeight: '100vh', background: colors.appBgGradient, color: colors.text }}>
      <LandingNav />
      <main style={{ paddingTop: 120, paddingBottom: 80, textAlign: 'center', color: colors.textSecondary }}>
        Sections coming next…
      </main>
    </div>
  );
}
