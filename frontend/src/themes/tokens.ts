export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const shadow = {
  sm: '0 1px 2px rgba(15,23,42,0.04)',
  md: '0 4px 12px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
  lg: '0 12px 32px rgba(15,23,42,0.08), 0 4px 8px rgba(15,23,42,0.04)',
  xl: '0 24px 64px rgba(15,23,42,0.12), 0 8px 16px rgba(15,23,42,0.04)',
  glow: '0 0 0 4px rgba(99,102,241,0.18)',
} as const;

export const shadowDark = {
  sm: '0 1px 2px rgba(0,0,0,0.4)',
  md: '0 4px 12px rgba(0,0,0,0.45), 0 1px 2px rgba(0,0,0,0.3)',
  lg: '0 12px 32px rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.3)',
  xl: '0 24px 64px rgba(0,0,0,0.55), 0 8px 16px rgba(0,0,0,0.35)',
  glow: '0 0 0 4px rgba(129,140,248,0.25)',
} as const;

export const duration = {
  fast: 150,
  base: 200,
  slow: 300,
} as const;

export const easing = {
  entrance: 'cubic-bezier(0.16, 1, 0.3, 1)',
  standard: 'ease-in-out',
} as const;

export const palette = {
  light: {
    primary: '#6366F1',
    primaryHover: '#4F46E5',
    primaryActive: '#4338CA',
    primaryGradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    primaryGradientSoft: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.12) 100%)',
    accent: '#06B6D4',
    accentGradient: 'linear-gradient(135deg, #06B6D4 0%, #0EA5E9 100%)',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    appBg: '#F6F8FC',
    appBgGradient:
      'radial-gradient(1200px 600px at 0% 0%, rgba(99,102,241,0.08), transparent), radial-gradient(900px 500px at 100% 0%, rgba(6,182,212,0.06), transparent), #F6F8FC',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceMuted: '#F1F5F9',
    border: '#E5E9F0',
    borderStrong: '#CBD5E1',
    text: '#0F172A',
    textSecondary: '#64748B',
    textTertiary: '#94A3B8',
    glassBg: 'rgba(255,255,255,0.72)',
    glassBorder: 'rgba(255,255,255,0.6)',
    sidebarBg: 'linear-gradient(180deg, #1E1B4B 0%, #312E81 100%)',
    sidebarText: 'rgba(255,255,255,0.85)',
    sidebarTextMuted: 'rgba(255,255,255,0.55)',
    sidebarSelected: 'rgba(255,255,255,0.14)',
    sidebarHover: 'rgba(255,255,255,0.08)',
  },
  dark: {
    primary: '#818CF8',
    primaryHover: '#A78BFA',
    primaryActive: '#6366F1',
    primaryGradient: 'linear-gradient(135deg, #818CF8 0%, #A78BFA 100%)',
    primaryGradientSoft: 'linear-gradient(135deg, rgba(129,140,248,0.18) 0%, rgba(167,139,250,0.18) 100%)',
    accent: '#22D3EE',
    accentGradient: 'linear-gradient(135deg, #22D3EE 0%, #38BDF8 100%)',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    info: '#60A5FA',
    appBg: '#0B1020',
    appBgGradient:
      'radial-gradient(1200px 600px at 0% 0%, rgba(129,140,248,0.12), transparent), radial-gradient(900px 500px at 100% 0%, rgba(34,211,238,0.08), transparent), #0B1020',
    surface: '#111933',
    surfaceElevated: '#172044',
    surfaceMuted: '#0F172A',
    border: '#1F2A4D',
    borderStrong: '#2A3669',
    text: '#E2E8F0',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    glassBg: 'rgba(17,25,51,0.62)',
    glassBorder: 'rgba(255,255,255,0.06)',
    sidebarBg: 'linear-gradient(180deg, #0B1020 0%, #1E1B4B 100%)',
    sidebarText: 'rgba(255,255,255,0.85)',
    sidebarTextMuted: 'rgba(255,255,255,0.5)',
    sidebarSelected: 'rgba(255,255,255,0.12)',
    sidebarHover: 'rgba(255,255,255,0.06)',
  },
} as const;

export type ThemeMode = 'light' | 'dark';

export interface Palette {
  primary: string;
  primaryHover: string;
  primaryActive: string;
  primaryGradient: string;
  primaryGradientSoft: string;
  accent: string;
  accentGradient: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  appBg: string;
  appBgGradient: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  glassBg: string;
  glassBorder: string;
  sidebarBg: string;
  sidebarText: string;
  sidebarTextMuted: string;
  sidebarSelected: string;
  sidebarHover: string;
}

export const fontFamily =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif";
