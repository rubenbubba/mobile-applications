export type ToneName = 'healthy' | 'warning' | 'serious' | 'critical' | 'neutral';
export type SpaceKey = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export interface ToneColors {
  text: string;
  background: string;
  mark: string;
}

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  accentText: string;
  onAccent: string;
  chartMuted: string;
  scrim: string;
  onScrim: string;
  onCriticalMark: string;
  tones: Record<ToneName, ToneColors>;
}

export interface Theme {
  isDark: boolean;
  colors: ThemeColors;
}

export const lightTheme: Theme = {
  isDark: false,
  colors: {
    background: '#F5F5F1',
    surface: '#FFFFFF',
    surfaceMuted: '#EEEFEA',
    border: '#E2E3DD',
    borderStrong: '#8A938D',
    text: '#18201C',
    textSecondary: '#4C5651',
    textMuted: '#5D6761',
    accent: '#0E5E4E',
    accentSoft: '#E1F0EB',
    accentText: '#0E5E4E',
    onAccent: '#FFFFFF',
    chartMuted: '#C5D0CA',
    scrim: '#18201C',
    onScrim: '#FFFFFF',
    onCriticalMark: '#FFFFFF',
    tones: {
      healthy: { text: '#126B3E', background: '#E3F4EA', mark: '#1F9D5C' },
      warning: { text: '#7A4B00', background: '#FCF0D9', mark: '#E0A100' },
      serious: { text: '#9C3B00', background: '#FCEADD', mark: '#E56A1C' },
      critical: { text: '#AE241C', background: '#FCE8E6', mark: '#D8392E' },
      neutral: { text: '#434D48', background: '#ECEEEA', mark: '#8A938D' },
    },
  },
};

export const darkTheme: Theme = {
  isDark: true,
  colors: {
    background: '#111412',
    surface: '#1A1E1B',
    surfaceMuted: '#242924',
    border: '#323833',
    borderStrong: '#6F7972',
    text: '#F2F4F1',
    textSecondary: '#BCC4BE',
    textMuted: '#A0A9A3',
    accent: '#4FC3A6',
    accentSoft: '#163229',
    accentText: '#6FD6BC',
    onAccent: '#06251E',
    chartMuted: '#48524C',
    scrim: '#000000',
    onScrim: '#FFFFFF',
    onCriticalMark: '#2A0B08',
    tones: {
      healthy: { text: '#77DDA4', background: '#15301F', mark: '#3CB877' },
      warning: { text: '#F3C15F', background: '#352A0F', mark: '#E6AC33' },
      serious: { text: '#F6A878', background: '#3A2213', mark: '#EB8344' },
      critical: { text: '#F7A199', background: '#3D1B18', mark: '#E8605A' },
      neutral: { text: '#C8CEC9', background: '#2A2F2B', mark: '#6F7972' },
    },
  },
};

export const spacing: Record<SpaceKey, number> = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

export const MIN_TOUCH_TARGET = 48;
export const WIDE_BREAKPOINT = 900;
export const TABLET_BREAKPOINT = 600;
export const CONTENT_MAX_WIDTH = 1080;
