// One consistent home for every kundli / chakra / wheel. Fixes the recurring
// "charts clip / misplace / sit at different sizes" problem systematically:
// a centered, square, responsive box with breathing room and no clipping.
import type { ReactNode } from 'react'
import { space, radius, type as t } from './tokens'

interface Props {
  children: ReactNode
  title?: string
  /** max rendered width of the chart in px (defaults 460, mobile shrinks) */
  max?: number
  right?: ReactNode  // optional controls (e.g. N/S/E style switch)
}

export default function ChartFrame({ children, title, max = 460, right }: Props) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: radius.l, padding: space.lg, boxShadow: 'var(--shadow-s)',
      overflow: 'visible',
    }}>
      {(title || right) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: space.sm, marginBottom: space.md }}>
          {title && <div style={{ ...t.label, color: 'var(--text3)' }}>{title}</div>}
          {right && <div style={{ marginLeft: 'auto' }}>{right}</div>}
        </div>
      )}
      <div style={{
        width: '100%', maxWidth: max, margin: '0 auto',
        aspectRatio: '1 / 1', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {children}
      </div>
    </div>
  )
}
