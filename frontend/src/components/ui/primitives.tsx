// Small shared primitives: SectionHeader, Chip, StatTile.
import type { ReactNode } from 'react'
import { space, radius, type as t, devanagari } from './tokens'

export function SectionHeader({ title, hint, right }: { title: string; hint?: string; right?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: space.sm, marginBottom: space.md, flexWrap: 'wrap' }}>
      <div style={{ ...t.label, color: 'var(--text3)', fontFamily: devanagari }}>{title}</div>
      {hint && <span style={{ ...t.micro, color: 'var(--text4)' }}>{hint}</span>}
      {right && <div style={{ marginLeft: 'auto' }}>{right}</div>}
    </div>
  )
}

export function Chip({ children, color, tone = 'soft' }: { children: ReactNode; color?: string; tone?: 'soft' | 'solid' | 'outline' }) {
  const c = color || 'var(--accent)'
  const styles = tone === 'solid'
    ? { background: c, color: '#fff', border: `1px solid ${c}` }
    : tone === 'outline'
      ? { background: 'transparent', color: c, border: `1px solid ${c}` }
      : { background: 'var(--surface2)', color: c, border: '1px solid var(--border)' }
  return (
    <span style={{
      ...t.micro, padding: `3px ${space.sm + 2}px`, borderRadius: radius.s,
      fontWeight: 600, whiteSpace: 'nowrap', fontFamily: devanagari, ...styles,
    }}>{children}</span>
  )
}

export function StatTile({ label, value, hint, accent }: { label: string; value: ReactNode; hint?: string; accent?: string }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: radius.m,
      padding: space.lg, minWidth: 120,
    }}>
      <div style={{ ...t.label, color: 'var(--text3)' }}>{label}</div>
      <div style={{ ...t.h1, color: accent || 'var(--text)', marginTop: space.xs, fontFamily: devanagari }}>{value}</div>
      {hint && <div style={{ ...t.micro, color: 'var(--text4)', marginTop: 2 }}>{hint}</div>}
    </div>
  )
}
