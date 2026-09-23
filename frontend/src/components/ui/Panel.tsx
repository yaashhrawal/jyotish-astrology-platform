// The standard panel wrapper: card + header + built-in loading/empty/error.
// Every analysis tab should render through this so spacing, radius, headers
// and states are identical everywhere.
import type { ReactNode } from 'react'
import { space, radius, type as t, devanagari } from './tokens'
import { LoadingState, EmptyState, ErrorState } from './AsyncStates'

interface Props {
  title?: string
  subtitle?: string
  right?: ReactNode
  loading?: boolean
  error?: string
  empty?: boolean
  emptyMessage?: string
  loadingLabel?: string
  padded?: boolean
  children: ReactNode
}

export default function Panel({
  title, subtitle, right, loading, error, empty,
  emptyMessage, loadingLabel, padded = true, children,
}: Props) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: radius.l, boxShadow: 'var(--shadow-s)', overflow: 'hidden',
    }}>
      {(title || right) && (
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: space.sm,
          padding: `${space.md}px ${space.lg}px`, borderBottom: '1px solid var(--border)',
        }}>
          <div>
            {title && <div style={{ ...t.h3, color: 'var(--text)', fontFamily: devanagari }}>{title}</div>}
            {subtitle && <div style={{ ...t.micro, color: 'var(--text3)', marginTop: 2 }}>{subtitle}</div>}
          </div>
          {right && <div style={{ marginLeft: 'auto' }}>{right}</div>}
        </div>
      )}
      <div style={{ padding: padded ? space.lg : 0 }}>
        {loading ? <LoadingState label={loadingLabel} />
          : error ? <ErrorState message={error} />
          : empty ? <EmptyState message={emptyMessage} />
          : children}
      </div>
    </div>
  )
}
