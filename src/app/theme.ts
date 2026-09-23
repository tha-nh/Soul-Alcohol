export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  colors: {
    background: string;
    surface: string;
    surfaceElevated: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    primary: string;
    primaryText: string;
    normal: string;
    notice: string;
    warning: string;
    stopRecommended: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
    pill: number;
  };
  typography: {
    display: { fontSize: number; fontWeight: '700'; lineHeight: number };
    title: { fontSize: number; fontWeight: '700'; lineHeight: number };
    subtitle: { fontSize: number; fontWeight: '600'; lineHeight: number };
    body: { fontSize: number; fontWeight: '400'; lineHeight: number };
    caption: { fontSize: number; fontWeight: '400'; lineHeight: number };
    button: { fontSize: number; fontWeight: '700'; lineHeight: number };
  };
}

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const radius = {
  sm: 8,
  md: 16,
  lg: 24,
  pill: 999,
};

const typography: Theme['typography'] = {
  display: { fontSize: 56, fontWeight: '700', lineHeight: 64 },
  title: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  subtitle: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  button: { fontSize: 17, fontWeight: '700', lineHeight: 22 },
};

/**
 * Alert-level colors intentionally differ in both hue and lightness so
 * status is never conveyed by color alone (Section 54).
 */
export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    background: '#0B0D12',
    surface: '#161922',
    surfaceElevated: '#1E222E',
    border: '#2A2F3D',
    textPrimary: '#F5F6FA',
    textSecondary: '#A8AFC0',
    textMuted: '#6B7284',
    primary: '#5B8CFF',
    primaryText: '#0B0D12',
    normal: '#3DDC84',
    notice: '#F2C94C',
    warning: '#F2994A',
    stopRecommended: '#EB5757',
  },
  spacing,
  radius,
  typography,
};

export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    background: '#F7F8FA',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    border: '#E2E5EC',
    textPrimary: '#14161C',
    textSecondary: '#4A4F5C',
    textMuted: '#8A8F9C',
    primary: '#2F5FE0',
    primaryText: '#FFFFFF',
    normal: '#1E9E5A',
    notice: '#B8860B',
    warning: '#C1611A',
    stopRecommended: '#C0392B',
  },
  spacing,
  radius,
  typography,
};
