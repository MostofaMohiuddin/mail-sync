import { Link } from 'react-router-dom';

import Logo from '../../components/ui/Logo';
import { useThemeMode } from '../../hooks/useThemeMode';

export default function LandingFooter() {
  const { colors } = useThemeMode();

  const linkStyle: React.CSSProperties = {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: 500,
    textDecoration: 'none',
    transition: 'color 150ms ease-in-out',
  };

  return (
    <footer
      style={{
        padding: '48px 24px 64px',
        borderTop: `1px solid ${colors.border}`,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
        }}
      >
        <Logo size="md" />
        <div style={{ fontSize: 13, color: colors.textTertiary }}>
          © {new Date().getFullYear()} MailSync · Crafted with care.
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          <Link to="/sign-in" style={linkStyle}>
            Sign in
          </Link>
          <Link to="/sign-up" style={linkStyle}>
            Sign up
          </Link>
          {/* GitHub link is a placeholder — real URL TBD by the team. */}
          <a href="#" style={linkStyle} onClick={(e) => e.preventDefault()} role="button">
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
