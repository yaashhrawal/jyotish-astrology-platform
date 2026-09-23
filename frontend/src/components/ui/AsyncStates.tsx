// Shared loading / empty / error states — replaces ~44 panels that render
// a blank pane on no data, and the copy-pasted red hex error boxes.
import { space, radius, type } from './tokens'

export function LoadingState({ label = 'Computing…' }: { label?: string }) {
  return (
    <div style={{ padding: space.xl, color: 'var(--text3)', fontSize: 13, display: 'flex', alignItems: 'center', gap: space.sm }}>
      <span style={{
        width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--border)',
        borderTopColor: 'var(--accent)', display: 'inline-block', animation: 'jyo-spin .7s linear infinite',
      }} />
      {label}
      <style>{`@keyframes jyo-spin{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){*{animation:none!important}}`}</style>
    </div>
  )
}

export function EmptyState({ message = 'Calculate a chart to see this.' }: { message?: string }) {
  return (
    <div style={{
      padding: `${space.xxl}px ${space.xl}px`, textAlign: 'center', color: 'var(--text4)',
      fontSize: 13, background: 'var(--surface2)', borderRadius: radius.m, border: '1px dashed var(--border)',
    }}>
      {message}
    </div>
  )
}

export function ErrorState({ message }: { message: string }) {
  // Never leak dev hints (e.g. "port 8888") to users.
  const clean = /port\s*8888|ECONNREFUSED|Network Error|Failed to fetch/i.test(message)
    ? 'Could not reach the calculation service. Please try again in a moment.'
    : message
  return (
    <div style={{
      padding: `${space.md}px ${space.lg}px`, background: 'var(--red-bg)', border: '1px solid var(--red)',
      borderRadius: radius.m, color: 'var(--red)', ...type.small,
    }}>
      {clean}
    </div>
  )
}
