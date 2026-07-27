import { useState, useEffect } from 'react'
import { vargaDashaApi } from '../api/client'
import { useLang } from '../contexts/LanguageContext'

const PLANET_COLORS: Record<string, string> = {
  Sun:'#D97706', Moon:'#0891B2', Mars:'#DC2626', Mercury:'#16A34A',
  Jupiter:'#B45309', Venus:'#7C3AED', Saturn:'#2563EB', Rahu:'#57534E', Ketu:'#A8A29E',
}

const VARGA_OPTIONS = [
  { d: 9,  label: 'D9 Navamsha',   domain: 'Spouse · Marriage · Dharma' },
  { d: 10, label: 'D10 Dashamsha', domain: 'Career · Profession · Status' },
  { d: 12, label: 'D12 Dwadashamsha', domain: 'Parents · Ancestry' },
  { d: 4,  label: 'D4 Chaturthamsha', domain: 'Property · Vehicles · Comforts' },
  { d: 7,  label: 'D7 Saptamsha',  domain: 'Children · Progeny' },
  { d: 3,  label: 'D3 Drekkana',   domain: 'Siblings · Courage' },
  { d: 24, label: 'D24 Chaturvimshamsha', domain: 'Education · Learning' },
  { d: 20, label: 'D20 Vimshamsha', domain: 'Spiritual progress' },
  { d: 60, label: 'D60 Shashtyamsha', domain: 'Past karma · Precise timing' },
]

interface Props { birthData: any }

function DashaRow({ d }: { d: any }) {
  const { t } = useLang()
  const [open, setOpen] = useState(d.is_active)
  const color = PLANET_COLORS[d.lord] || '#888'
  return (
    <div style={{ border: '1px solid var(--border)', borderLeft: `4px solid ${d.is_active ? color : 'transparent'}`, borderRadius: 'var(--radius-m)', background: d.is_active ? color + '08' : 'var(--surface)', overflow: 'hidden' }}>
      <div onClick={() => setOpen((o: boolean) => !o)} style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px', color }}>{d.lord.slice(0,2)}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color }}>{d.lord} {t('Dasha')}</div>
          <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{d.start?.slice(0,7)} → {d.end?.slice(0,7)} · {d.years}y</div>
        </div>
        {d.is_active && <span style={{ fontSize: '10px', fontWeight: '700', color, background: color + '18', padding: '2px 8px', borderRadius: '20px' }}>◉ {t('Active')}</span>}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', color: 'var(--text3)' }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      {open && (
        <div style={{ padding: '0 14px 12px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '8px' }}>
          {d.antardashas?.map((ad: any, i: number) => {
            const aColor = PLANET_COLORS[ad.lord] || '#888'
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', borderRadius: '6px', background: ad.is_active ? aColor + '12' : 'transparent', border: ad.is_active ? `1px solid ${aColor}40` : '1px solid transparent' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: aColor, width: '50px' }}>{ad.lord}</span>
                <span style={{ fontSize: '10.5px', color: 'var(--text3)', flex: 1 }}>{ad.start?.slice(0,7)} → {ad.end?.slice(0,7)}</span>
                <span style={{ fontSize: '10.5px', color: 'var(--text3)' }}>{ad.years}y</span>
                {ad.is_active && <span style={{ fontSize: '9px', color: aColor, fontWeight: '700' }}>◉</span>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function VargaDashaPanel({ birthData }: Props) {
  const { t } = useLang()
  const [selectedD, setSelectedD] = useState(9)
  const [cache, setCache] = useState<Record<number, any>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!birthData || cache[selectedD]) return
    setLoading(true); setError('')
    vargaDashaApi.get({ ...birthData, d: selectedD })
      .then(d => setCache(c => ({ ...c, [selectedD]: d })))
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false))
  }, [birthData, selectedD])

  const data = cache[selectedD]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Varga selector */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {VARGA_OPTIONS.map(o => (
          <button key={o.d} onClick={() => setSelectedD(o.d)} style={{
            padding: '8px 14px', borderRadius: 'var(--radius-m)', cursor: 'pointer', textAlign: 'left',
            border: `1px solid ${selectedD === o.d ? 'var(--accent)' : 'var(--border)'}`,
            background: selectedD === o.d ? 'var(--accent)' : 'var(--surface)',
            color: selectedD === o.d ? '#fff' : 'var(--text)',
          }}>
            <div style={{ fontSize: '12px', fontWeight: '700' }}>{t(o.label)}</div>
            <div style={{ fontSize: '10px', opacity: 0.75, marginTop: '1px' }}>{t(o.domain)}</div>
          </button>
        ))}
      </div>

      {/* Info */}
      {data && (
        <div style={{ padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-m)' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '4px' }}>
            {t('Vimshottari from')} {data.varga_name} {t('Lagna')} — {data.domain}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
            {data.varga_name} {t('Lagna nakshatra')}: <strong>{data.varga_lagna}</strong> ({t('lord')}: <strong>{data.varga_lagna_lord}</strong>)
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>{data.note}</div>
        </div>
      )}

      {loading && <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>{t('Calculating…')}</div>}
      {error && <div style={{ padding: '12px', color: 'var(--red)', fontSize: '13px' }}>{error}</div>}

      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {data.dashas.map((d: any, i: number) => <DashaRow key={i} d={d} />)}
        </div>
      )}
    </div>
  )
}
