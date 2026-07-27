import { useEffect, useState } from 'react'
import { reportsApi } from '../../api/client'
import { useLang } from '../../contexts/LanguageContext'
import toast from 'react-hot-toast'

const SECTION_LABELS: Record<string, string> = {
  birth_details: 'Birth Details',
  chart_wheel: 'Chart Wheel (Rashi D-1)',
  planets: 'Planetary Positions',
  dashas: 'Vimshottari Dasha',
  yogas: 'Yogas',
  atmakaraka: 'Atmakaraka & Karakas',
  doshas: 'Doshas Summary',
  interpretation: "Astrologer's Interpretation",
  ashtakavarga: 'Ashtakavarga',
  shadbala: 'Shadbala',
  vimshopaka: 'Vimshopaka Bala',
  varga_charts: 'Divisional Charts (D-9, D-10, etc.)',
  jaimini_karakas: 'Jaimini Karakas',
  arudha_padas: 'Arudha Padas',
  yogini_dasha: 'Yogini Dasha',
  chara_dasha: 'Chara Dasha',
  narayana_dasha: 'Narayana Dasha',
  ashtottari_dasha: 'Ashtottari Dasha',
  transit_forecast: 'Transit Forecast (12 mo)',
  varshaphal: 'Varshaphal (Annual)',
  numerology: 'Numerology',
  remedies: 'Remedies',
  compatibility: 'Compatibility',
  panchanga: 'Panchanga',
  special_lagnas: 'Special Lagnas',
  saham_points: 'Saham Points',
  upagrahas: 'Upagrahas',
  sarvatobhadra: 'Sarvatobhadra Chakra',
}

interface Props {
  open: boolean
  onClose: () => void
  chartId?: string
  birthData?: any
  clientName?: string
}

export default function ReportBuilderModal({ open, onClose, chartId, birthData, clientName }: Props) {
  const { t } = useLang()
  const [coreList, setCoreList] = useState<string[]>([])
  const [advList, setAdvList] = useState<string[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [interpretation, setInterpretation] = useState('')
  const [templates, setTemplates] = useState<any[]>([])
  const [tplName, setTplName] = useState('')
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (!open) return
    reportsApi.sections().then(d => {
      setCoreList(d.core)
      setAdvList(d.advanced)
      setSelected(new Set(d.core.filter((s: string) => s !== 'header')))
    })
    reportsApi.templates().then(setTemplates)
  }, [open])

  if (!open) return null

  const toggle = (s: string) => {
    const next = new Set(selected)
    if (next.has(s)) next.delete(s); else next.add(s)
    setSelected(next)
  }
  const applyTemplate = (sections: string[]) => setSelected(new Set(sections))

  const saveTpl = async () => {
    if (!tplName.trim()) return toast.error(t('Name required'))
    await reportsApi.saveTemplate(tplName, Array.from(selected))
    toast.success(t('Template saved'))
    setTplName('')
    reportsApi.templates().then(setTemplates)
  }

  const generate = async () => {
    setGenerating(true)
    try {
      const payload: any = {
        sections: Array.from(selected),
        interpretation,
        ...(chartId ? { chart_id: chartId }
                    : { name: clientName, ...birthData }),
      }
      const { blob } = await reportsApi.generate(payload)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${clientName || 'report'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(t('Report generated'))
      onClose()
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || t('Generation failed'))
    } finally { setGenerating(false) }
  }

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }
  const panel: React.CSSProperties = {
    background: 'var(--surface)', borderRadius: 12, padding: 20, width: 720,
    maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto',
  }
  const sectionLabel: React.CSSProperties = { fontSize: 11, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginTop: 14, marginBottom: 6 }

  const Checkbox = ({ k }: { k: string }) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 4, cursor: 'pointer', background: selected.has(k) ? 'var(--accent-bg)' : 'transparent' }}>
      <input type="checkbox" checked={selected.has(k)} onChange={() => toggle(k)} />
      <span style={{ fontSize: 12 }}>{t(SECTION_LABELS[k] || k)}</span>
    </label>
  )

  return (
    <div style={overlay} onClick={onClose}>
      <div style={panel} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{t('Build PDF Report')}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text3)' }}>×</button>
        </div>

        {templates.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={sectionLabel}>{t('Saved Templates')}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {templates.map(tpl => (
                <button key={tpl.id} onClick={() => applyTemplate(tpl.sections)} style={{
                  padding: '4px 10px', borderRadius: 12, fontSize: 11,
                  border: '1px solid var(--border)', background: 'var(--surface2)', cursor: 'pointer',
                }}>{tpl.name}{tpl.is_default ? ' ★' : ''}</button>
              ))}
            </div>
          </div>
        )}

        <div style={sectionLabel}>{t('Core Sections')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 }}>
          {coreList.filter(s => s !== 'header').map(k => <Checkbox key={k} k={k} />)}
        </div>

        <div style={sectionLabel}>{t('Advanced Sections (optional)')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 }}>
          {advList.map(k => <Checkbox key={k} k={k} />)}
        </div>

        <div style={sectionLabel}>{t('Interpretation Notes')}</div>
        <textarea value={interpretation} onChange={e => setInterpretation(e.target.value)}
                  placeholder={t('Free-text analysis from astrologer...')}
                  style={{ width: '100%', minHeight: 100, padding: 10, fontSize: 13,
                           border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface2)', color: 'var(--text)' }} />

        <div style={{ display: 'flex', gap: 8, marginTop: 14, alignItems: 'center' }}>
          <input value={tplName} onChange={e => setTplName(e.target.value)} placeholder={t('Template name…')}
                 style={{ flex: 1, padding: '7px 10px', fontSize: 12, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface2)', color: 'var(--text)' }} />
          <button onClick={saveTpl} style={{ padding: '7px 14px', fontSize: 12, border: '1px solid var(--border)', background: 'var(--surface2)', borderRadius: 6, cursor: 'pointer' }}>
            {t('Save as Template')}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface2)', cursor: 'pointer', fontSize: 13 }}>{t('Cancel')}</button>
          <button onClick={generate} disabled={generating || selected.size === 0} style={{
            padding: '8px 20px', background: 'var(--accent)', color: '#fff', border: 'none',
            borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: generating ? 'not-allowed' : 'pointer',
            opacity: generating || selected.size === 0 ? 0.6 : 1,
          }}>{generating ? t('Generating…') : `${t('Generate PDF')} (${selected.size})`}</button>
        </div>
      </div>
    </div>
  )
}
