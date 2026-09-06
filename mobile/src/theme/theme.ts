// Grahika design tokens — semantic palette, dark + light.
// NEVER hardcode a hex in a screen. Read from useColors().

export type ThemeName = 'dark' | 'light';

export interface Colors {
  bgPrimary: string;   // app root
  bgBody: string;      // scroll body
  bgCard: string;      // cards / inputs surface
  bgElevated: string;  // sheets, menus
  borderCard: string;
  borderStrong: string;

  accentPrimary: string;   // Grahika saffron
  accentSecondary: string; // light saffron
  accentDeep: string;      // pressed
  accentBg: string;        // tint behind accent text
  accentRed: string;
  accentYellow: string;
  accentGreen: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;
  onAccent: string;        // text on saffron

  inputBg: string;
  inputBorder: string;
  inputFocusBorder: string;
  tagBg: string;
  pillActiveBg: string;
  navBg: string;
  overlay: string;
}

const SAFFRON = '#B4581F';
const SAFFRON_LT = '#D97B3C';

export const dark: Colors = {
  bgPrimary: '#141210',
  bgBody: '#17150F',
  bgCard: '#1F1C18',
  bgElevated: '#252119',
  borderCard: '#2C2822',
  borderStrong: '#3A342A',

  accentPrimary: SAFFRON,
  accentSecondary: SAFFRON_LT,
  accentDeep: '#8F4418',
  accentBg: '#2A2213',
  accentRed: '#D66A5A',
  accentYellow: '#E0B567',
  accentGreen: '#67BC80',

  textPrimary: '#F1ECE2',
  textSecondary: 'rgba(241,236,226,0.62)',
  textMuted: 'rgba(241,236,226,0.38)',
  textDisabled: 'rgba(241,236,226,0.22)',
  onAccent: '#FFFFFF',

  inputBg: '#1F1C18',
  inputBorder: '#3A342A',
  inputFocusBorder: SAFFRON,
  tagBg: '#252119',
  pillActiveBg: '#2A2213',
  navBg: '#1A1712',
  overlay: 'rgba(0,0,0,0.6)',
};

export const light: Colors = {
  bgPrimary: '#F4F0E8',
  bgBody: '#F7F3EC',
  bgCard: '#FFFFFF',
  bgElevated: '#FFFFFF',
  borderCard: '#E7E1D4',
  borderStrong: '#D6CFBF',

  accentPrimary: SAFFRON,
  accentSecondary: SAFFRON_LT,
  accentDeep: '#8F4418',
  accentBg: '#FBEFE6',
  accentRed: '#C0392B',
  accentYellow: '#B45309',
  accentGreen: '#3B7A4E',

  textPrimary: '#231F1A',
  textSecondary: 'rgba(35,31,26,0.66)',
  textMuted: 'rgba(35,31,26,0.42)',
  textDisabled: 'rgba(35,31,26,0.28)',
  onAccent: '#FFFFFF',

  inputBg: '#FFFFFF',
  inputBorder: '#D6CFBF',
  inputFocusBorder: SAFFRON,
  tagBg: '#F1EBDF',
  pillActiveBg: '#FBEFE6',
  navBg: '#FFFFFF',
  overlay: 'rgba(28,25,23,0.45)',
};

export const palettes: Record<ThemeName, Colors> = { dark, light };

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 } as const;
