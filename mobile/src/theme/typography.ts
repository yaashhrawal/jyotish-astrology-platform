// Fixed type scale — the biggest "feels native" lever.
// Always fontSize + lineHeight + fontWeight together.
import { TextStyle } from 'react-native';

const DISPLAY = 'EBGaramond_600SemiBold';
const DISPLAY_BOLD = 'EBGaramond_700Bold';
const BODY = 'Inter_400Regular';
const BODY_MED = 'Inter_500Medium';
const BODY_SEMI = 'Inter_600SemiBold';
const BODY_BOLD = 'Inter_700Bold';

export const fonts = { DISPLAY, DISPLAY_BOLD, BODY, BODY_MED, BODY_SEMI, BODY_BOLD };

type T = TextStyle;

export const type = {
  // Display (EB Garamond) — big brand / screen heroes
  hero:        { fontFamily: DISPLAY_BOLD, fontSize: 34, lineHeight: 38, letterSpacing: 0.5 } as T,
  wordmark:    { fontFamily: DISPLAY_BOLD, fontSize: 22, lineHeight: 24, letterSpacing: 3 } as T,
  screenTitle: { fontFamily: DISPLAY, fontSize: 24, lineHeight: 28, letterSpacing: 0.3 } as T,
  // UI (Inter)
  sectionTitle:{ fontFamily: BODY_BOLD, fontSize: 18, lineHeight: 23 } as T,
  cardTitle:   { fontFamily: BODY_SEMI, fontSize: 14, lineHeight: 18 } as T,
  body:        { fontFamily: BODY, fontSize: 13, lineHeight: 19 } as T,
  bodyMed:     { fontFamily: BODY_MED, fontSize: 13, lineHeight: 19 } as T,
  caption:     { fontFamily: BODY, fontSize: 11, lineHeight: 15 } as T,
  micro:       { fontFamily: BODY_SEMI, fontSize: 9.5, lineHeight: 12, letterSpacing: 0.6 } as T,
  button:      { fontFamily: BODY_SEMI, fontSize: 15, lineHeight: 18 } as T,
  input:       { fontFamily: BODY, fontSize: 15, lineHeight: 20 } as T,
  eyebrow:     { fontFamily: BODY_BOLD, fontSize: 10.5, lineHeight: 13, letterSpacing: 1.4 } as T,
};
