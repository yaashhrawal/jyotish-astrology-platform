import { useEffect, useState } from 'react'
import { gemsApi, type Gem } from '../../api/client'
import GemRecommendModal from './GemRecommendModal'

const PLANETS = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu']
const PLANET_COLORS: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#B45309', Venus: '#7C3AED', Saturn: '#2563EB', Rahu: '#57534E', Ketu: '#A8A29E',
}
const fmtINR = (paise: number) => '₹' + (paise / 100).toLocaleString('en-IN')

interface Props {
  clientId: string
  clientName: string
  clientWhatsApp?: string
  weakPlanets?: string[]      // optional pre-suggestion
  onClose: () => void
}

export default function GemPickerForClient({ clientId, clientName, clientWhatsApp, weakPlanets, onClose }: Props) {
  const [gems, setGems] = useState<Gem[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Gem | null>(null)
  const [planet, setPlanet] = useState<string>(weakPlanets?.[0] || '')

  useEffect(() => {
    setLoading(true)
    gemsApi.catalog(planet ? { planet } : {}).then(setGems).finally(() => setLoading(false))
  }, [planet])

  if (selected) {
    return <GemRecommendModal
      gem={selected}
      clientId={clientId}
      clientName={clientName}
      clientWhatsApp={clientWhatsApp}
      onClose={() => { setSelected(null); onClose() }}
    />
  }

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
  }
  const panel: React.CSSProperties = {
    background: 'var(--surface)', borderRadius: 12, padding: 18, width: 720,
    maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto',
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={panel} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>💎 Pick a Gem for {clientName}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>Filter by significator planet, then pick a tier.</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text3)' }}>×</button>
        </div>

        {weakPlanets && weakPlanets.length > 0 && (
          <div style={{ padding: 10, background: '#fef3c7', borderRadius: 8, marginBottom: 12, fontSize: 12 }}>
            <strong>Suggested based on chart:</strong> {weakPlanets.join(', ')}
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          <button onClick={() => setPlanet('')} style={chip(!planet, '#6b7280')}>All</button>
          {PLANETS.map(p => (
            <button key={p} onClick={() => setPlanet(p)} style={chip(planet === p, PLANET_COLORS[p])}>{p}</button>
          ))}
        </div>

        {loading ? <div style={{ padding: 30, textAlign: 'center', color: 'var(--text3)' }}>Loading…</div> :
        gems.length === 0 ? <div style={{ padding: 30, textAlign: 'center', color: 'var(--text4)' }}>No gems found.</div> :
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
          {gems.map(g => (
            <button key={g.id} onClick={() => setSelected(g)} style={{
              background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8,
              padding: 12, textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 8, background: PLANET_COLORS[g.planet]+'22', color: PLANET_COLORS[g.planet] }}>{g.planet}</span>
                <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text4)', textTransform: 'uppercase' }}>{g.tier}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>{g.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text4)' }}>{g.cert_authority}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{fmtINR(g.retail_price_paise)}</span>
                <span style={{ fontSize: 11, color: '#16A34A', fontWeight: 600 }}>+{fmtINR(Math.floor(g.retail_price_paise * Number(g.base_commission_pct) / 100))}</span>
              </div>
            </button>
          ))}
        </div>}
      </div>
    </div>
  )
}

function chip(active: boolean, color: string): React.CSSProperties {
  return {
    padding: '4px 10px', borderRadius: 12, fontSize: 11,
    border: '1px solid ' + color + '88',
    background: active ? color : 'transparent',
    color: active ? '#fff' : color,
    cursor: 'pointer', fontWeight: active ? 600 : 400,
  }
}
