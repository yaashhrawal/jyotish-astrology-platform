import { useEffect, useState } from 'react'
import { gemsApi, type Gem } from '../../api/client'
import GemRecommendModal from './GemRecommendModal'

const PLANETS = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu']
const TIERS = [
  { id: 'all', label: 'All' },
  { id: 'premium', label: 'Premium', sub: 'GIA + GRS' },
  { id: 'standard', label: 'Standard', sub: 'IGI + GJEPC' },
  { id: 'budget', label: 'Budget', sub: 'GJEPC' },
]
const PLANET_COLORS: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#B45309', Venus: '#7C3AED', Saturn: '#2563EB', Rahu: '#57534E', Ketu: '#A8A29E',
}

const fmtINR = (paise: number) => '₹' + (paise / 100).toLocaleString('en-IN')

export default function GemShopPanel() {
  const [gems, setGems] = useState<Gem[]>([])
  const [planet, setPlanet] = useState<string>('')
  const [tier, setTier] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [recGem, setRecGem] = useState<any>(null)

  useEffect(() => {
    setLoading(true)
    const params: any = {}
    if (planet) params.planet = planet
    if (tier !== 'all') params.tier = tier
    gemsApi.catalog(params).then(setGems).finally(() => setLoading(false))
  }, [planet, tier])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>💎 Gemstone Marketplace</div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>
          Authentic gems, lab-certified. Recommend → we ship → you earn 20–25% commission.
        </div>
      </div>

      {/* Planet filter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>Planet:</span>
        <button onClick={() => setPlanet('')} style={chipStyle(!planet)}>All</button>
        {PLANETS.map(p => (
          <button key={p} onClick={() => setPlanet(p)} style={{
            ...chipStyle(planet === p), color: planet === p ? '#fff' : PLANET_COLORS[p],
            background: planet === p ? PLANET_COLORS[p] : 'transparent',
            borderColor: PLANET_COLORS[p] + '88',
          }}>{p}</button>
        ))}
      </div>

      {/* Tier filter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>Tier:</span>
        {TIERS.map(t => (
          <button key={t.id} onClick={() => setTier(t.id)} style={chipStyle(tier === t.id)}>
            {t.label}{t.sub && <span style={{ fontSize: 9, opacity: 0.7, marginLeft: 4 }}>({t.sub})</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 40, color: 'var(--text3)', textAlign: 'center' }}>Loading catalog…</div>
      ) : gems.length === 0 ? (
        <div style={{ padding: 40, color: 'var(--text3)', textAlign: 'center' }}>No gems match.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {gems.map(g => (
            <div key={g.id} style={{
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
              overflow: 'hidden', display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ padding: '14px 16px 8px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                    background: PLANET_COLORS[g.planet] + '22', color: PLANET_COLORS[g.planet], textTransform: 'uppercase' }}>
                    {g.planet}
                  </span>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                    background: g.tier === 'premium' ? '#fef3c7' : g.tier === 'standard' ? '#dbeafe' : '#f3f4f6',
                    color: g.tier === 'premium' ? '#92400e' : g.tier === 'standard' ? '#1e40af' : '#4b5563',
                    textTransform: 'uppercase' }}>
                    {g.tier}
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{g.name}</div>
                {g.sanskrit_name && (
                  <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: "'Noto Sans Devanagari', serif" }}>
                    {g.sanskrit_name}
                  </div>
                )}
              </div>
              <div style={{ padding: '10px 16px', flex: 1, fontSize: 11, color: 'var(--text3)' }}>
                {g.description}
                <div style={{ marginTop: 8, color: 'var(--text4)' }}>
                  Cert: <strong>{g.cert_authority}</strong> · Carat {g.carat_min}–{g.carat_max}
                </div>
              </div>
              <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text4)' }}>Retail</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{fmtINR(g.retail_price_paise)}</div>
                  <div style={{ fontSize: 10, color: '#16A34A', fontWeight: 600 }}>
                    Earn {g.base_commission_pct}% = {fmtINR(Math.floor(g.retail_price_paise * Number(g.base_commission_pct) / 100))}+
                  </div>
                </div>
                <button onClick={() => setRecGem(g)} style={{
                  padding: '7px 14px', background: 'var(--accent)', color: '#fff',
                  border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>Recommend</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {recGem && (
        <GemRecommendModal gem={recGem} onClose={() => setRecGem(null)} />
      )}
    </div>
  )
}

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: '4px 10px', borderRadius: 12, fontSize: 11,
    border: '1px solid var(--border)',
    background: active ? 'var(--accent)' : 'var(--surface2)',
    color: active ? '#fff' : 'var(--text2)',
    cursor: 'pointer', fontWeight: active ? 600 : 400,
  }
}
