import { useEffect, useState } from 'react'
import { chartsApi } from '../api/client'
import { useLang } from '../contexts/LanguageContext'

const S = {
  wrap: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px' },
  title: { color: 'var(--accent)', fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer' },
  name: { color: 'var(--text)', fontWeight: 'bold', fontSize: '14px' },
  meta: { color: 'var(--text3)', fontSize: '12px', marginTop: '2px' },
  badge: { fontSize: '11px', padding: '2px 7px', borderRadius: '4px', background: 'var(--accent-bg)', color: 'var(--accent)' },
  del: { color: '#dc2626', fontSize: '13px', cursor: 'pointer', marginLeft: '8px' },
  empty: { color: 'var(--text3)', fontSize: '14px', textAlign: 'center' as const, padding: '24px' },
}

interface Props {
  onSelect: (chart: any) => void
}

export default function SavedCharts({ onSelect }: Props) {
  const { t } = useLang()
  const [charts, setCharts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const data = await chartsApi.list()
      setCharts(data)
    } catch { /* DB not connected */ }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const del = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm(t('Delete this chart'))) return
    await chartsApi.delete(id)
    setCharts(c => c.filter(x => x.id !== id))
  }

  if (loading) return <div style={S.empty}>{t('Loading saved')}</div>
  if (!charts.length) return <div style={S.empty}>{t('No saved charts')}</div>

  return (
    <div style={S.wrap}>
      <div style={S.title}>{t('Saved Charts')} ({charts.length})</div>
      {charts.map(c => (
        <div key={c.id} style={S.row} onClick={() => onSelect(c)}>
          <div>
            <div style={S.name}>{c.name}</div>
            <div style={S.meta}>{c.birth_date} · {c.birth_place} · {c.ascendant_sign} Lagna</div>
            {c.yogas?.length > 0 && (
              <div style={{ marginTop: '4px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {c.yogas.slice(0, 3).map((y: string) => <span key={y} style={S.badge}>{y}</span>)}
                {c.yogas.length > 3 && <span style={{ ...S.badge, color: 'var(--text3)' }}>+{c.yogas.length - 3}</span>}
              </div>
            )}
          </div>
          <span style={S.del} onClick={e => del(e, c.id)}>✕</span>
        </div>
      ))}
    </div>
  )
}
