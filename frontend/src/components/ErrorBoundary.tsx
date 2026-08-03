/**
 * ErrorBoundary — stops a single panel's render error from white-screening the whole
 * app (which previously forced a hard refresh). Shows a recoverable message instead.
 */
import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode; name?: string }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    // surface for debugging without crashing the tree
    console.error('[panel error]', this.props.name, error)
  }

  // reset the error when the panel (children/name) changes
  componentDidUpdate(prev: Props) {
    if (prev.name !== this.props.name && this.state.error) this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '28px 24px', maxWidth: 560, margin: '24px auto', textAlign: 'center',
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
            This section hit an error
          </div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16, lineHeight: 1.5 }}>
            Something went wrong loading this panel. Your chart is safe — pick another tab, or try again.
          </div>
          <button onClick={() => this.setState({ error: null })} style={{
            padding: '8px 20px', background: 'var(--accent)', color: '#fff', border: 'none',
            borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
