import { useEffect, useState } from 'react';

import { Button } from 'antd';
import { Link } from 'react-router-dom';

import Logo from '../../components/ui/Logo';
import ThemeToggle from '../../components/ui/ThemeToggle';
import { useThemeMode } from '../../hooks/useThemeMode';

export default function LandingNav() {
  const { colors } = useThemeMode();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 12);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={scrolled ? 'as-glass' : undefined}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 200ms ease-in-out, border-color 200ms ease-in-out',
        borderBottom: scrolled ? `1px solid ${colors.border}` : '1px solid transparent',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1200,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <Link to="/" style={{ display: 'inline-flex' }}>
          <Logo size="md" />
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ThemeToggle />
          <Link to="/sign-in">
            <Button type="text" style={{ fontWeight: 600, color: colors.text }}>
              Sign in
            </Button>
          </Link>
          <Link to="/sign-up">
            <Button
              type="primary"
              style={{
                background: colors.primaryGradient,
                border: 'none',
                fontWeight: 600,
                boxShadow: '0 8px 18px rgba(99,102,241,0.32)',
              }}
            >
              Get started
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
