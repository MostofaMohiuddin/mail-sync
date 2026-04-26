import HowItWorks from './HowItWorks';
import InboxMockup from './InboxMockup';
import LandingHero from './LandingHero';
import LandingNav from './LandingNav';
import { useThemeMode } from '../../hooks/useThemeMode';

export default function Landing() {
  const { colors } = useThemeMode();
  return (
    <div style={{ minHeight: '100vh', background: colors.appBgGradient, color: colors.text }}>
      <LandingNav />
      <main>
        <LandingHero visual={<InboxMockup />} />
        <HowItWorks />
      </main>
    </div>
  );
}
