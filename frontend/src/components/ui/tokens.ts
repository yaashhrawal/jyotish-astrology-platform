// Grahika design-system tokens — the single source of truth.
// Colors resolve to the CSS custom properties already defined in index.css
// (light/dark aware). Scales below stop panels from re-inventing spacing/type.

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const

export const radius = {
  s: 'var(--radius-s)', m: 'var(--radius-m)', l: 'var(--radius-l)', xl: 'var(--radius-xl)',
} as const

export const shadow = {
  xs: 'var(--shadow-xs)', s: 'var(--shadow-s)', m: 'var(--shadow-m)', l: 'var(--shadow-l)',
} as const

// Type scale — one ramp every panel shares.
export const type = {
  display: { fontSize: 28, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.2 },
  h1:      { fontSize: 20, fontWeight: 700, letterSpacing: '-0.005em', lineHeight: 1.25 },
  h2:      { fontSize: 17, fontWeight: 700, lineHeight: 1.3 },
  h3:      { fontSize: 14, fontWeight: 700, lineHeight: 1.35 },
  body:    { fontSize: 14, fontWeight: 400, lineHeight: 1.6 },
  small:   { fontSize: 12.5, fontWeight: 400, lineHeight: 1.5 },
  micro:   { fontSize: 11, fontWeight: 500, lineHeight: 1.4 },
  label:   { fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const },
} as const

// The Devanagari-capable stack, declared once.
export const devanagari = "'Noto Sans Devanagari', 'Mangal', sans-serif"

// Canonical planet colors — resolves the drift (Jupiter/Saturn were inconsistent).
export const PLANET_COLORS: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#CA8A04', Venus: '#7C3AED', Saturn: '#2563EB', Rahu: '#57534E', Ketu: '#A8A29E',
}

// Dignity → semantic color (uses theme tokens, not literals).
export const DIGNITY_STYLE: Record<string, { bg: string; color: string }> = {
  exalted:     { bg: 'var(--green-bg)', color: 'var(--green)' },
  own_sign:    { bg: 'var(--accent-bg)', color: 'var(--accent)' },
  moolatrikona:{ bg: 'var(--accent-bg)', color: 'var(--accent)' },
  debilitated: { bg: 'var(--red-bg)', color: 'var(--red)' },
  neutral:     { bg: 'var(--surface2)', color: 'var(--text3)' },
}

export const planetColor = (name: string) => PLANET_COLORS[name] || 'var(--text2)'
