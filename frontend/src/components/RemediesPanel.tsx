import { useState, useEffect } from 'react'
import { remediesApi } from '../api/client'
import { useLang } from '../contexts/LanguageContext'
import { translate } from '../i18n/terms'

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#B45309', Venus: '#7C3AED', Saturn: '#2563EB', Rahu: '#57534E', Ketu: '#A8A29E',
}

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mars: '♂', Mercury: '☿',
  Jupiter: '♃', Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋',
}

const PRIORITY_CONFIG: Record<string, { label: string; hiLabel: string; color: string; bg: string }> = {
  high:   { label: 'High Priority',   hiLabel: 'उच्च प्राथमिकता', color: '#DC2626', bg: '#FEF2F2' },
  medium: { label: 'Medium Priority', hiLabel: 'मध्यम प्राथमिकता', color: '#D97706', bg: '#FFFBEB' },
  low:    { label: 'Optional',        hiLabel: 'वैकल्पिक',         color: '#0891B2', bg: '#F0F9FF' },
  none:   { label: 'Strong — No Remedy Needed', hiLabel: 'बलवान — उपाय आवश्यक नहीं', color: '#16A34A', bg: '#F0FDF4' },
}

interface Props { birthData: any }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: '14px' }}>
      <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function PlanetCard({ planet, data, lang }: { planet: string; data: any; lang: string }) {
  const [open, setOpen] = useState(data.priority === 'high')
  const color = PLANET_COLORS[planet] || '#888'
  const sym = PLANET_SYMBOLS[planet] || '✦'
  const pc = PRIORITY_CONFIG[data.priority] || PRIORITY_CONFIG.low

  return (
    <div style={{
      border: `1px solid ${data.priority === 'high' ? color + '40' : 'var(--border)'}`,
      borderLeft: `4px solid ${data.priority === 'none' ? '#16A34A' : color}`,
      borderRadius: 'var(--radius-m)',
      background: 'var(--surface)',
      overflow: 'hidden',
      transition: 'box-shadow .15s',
    }}>
      {/* Header */}
      <div
        style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
        onClick={() => setOpen(o => !o)}
      >
        <div style={{
          width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
          background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px', color,
        }}>{sym}</div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text)' }}>
              {translate(planet, lang as any)}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
              {translate(data.sign, lang as any)} · {data.status?.replace('_', ' ')}
              {data.retrograde ? ' (R)' : ''}
            </span>
          </div>
          <div style={{ marginTop: '3px' }}>
            <span style={{
              fontSize: '10.5px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px',
              background: pc.bg, color: pc.color,
            }}>
              {lang === 'hi' || lang === 'sa' ? pc.hiLabel : pc.label}
            </span>
          </div>
        </div>

        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{
          transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s',
          color: 'var(--text3)', flexShrink: 0,
        }}>
          <path d="M2.5 5l4.5 4.5L11.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {open && data.priority !== 'none' && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>

          {/* Gem */}
          <Section title="💎 Gemstone (Ratna)">
            <div style={{ padding: '10px 12px', background: 'var(--surface2)', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color }}>
                {data.gem?.primary}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text2)', marginTop: '4px' }}>
                Alternatives: {data.gem?.alt?.join(' · ')}
              </div>
              <div style={{ marginTop: '6px', display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '11px', color: 'var(--text3)' }}>
                <span>Metal: <strong>{data.gem?.metal}</strong></span>
                <span>·</span>
                <span>Finger: <strong>{data.gem?.finger}</strong></span>
              </div>
            </div>
          </Section>

          {/* Rudraksha */}
          <Section title="🔮 Rudraksha">
            <div style={{ padding: '10px 12px', background: 'var(--surface2)', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#B45309' }}>
                {data.rudraksha?.mukhi} Mukhi — {data.rudraksha?.name}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text2)', marginTop: '4px' }}>
                Deity: {data.rudraksha?.deity}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text3)', marginTop: '3px' }}>
                Benefit: {data.rudraksha?.benefit}
              </div>
            </div>
          </Section>

          {/* Mantra */}
          <Section title="🕉 Mantra">
            <div style={{ padding: '10px 12px', background: 'var(--surface2)', borderRadius: '8px' }}>
              <div style={{
                fontSize: '14px', fontWeight: '600', color: '#5746af',
                fontFamily: "'Noto Sans Devanagari', 'Mangal', serif",
                lineHeight: 1.8, marginBottom: '6px',
              }}>
                {data.mantra?.beej}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                Vedic: <span style={{ fontFamily: "'Noto Sans Devanagari', serif", fontSize: '11px' }}>{data.mantra?.vedic}</span>
              </div>
              <div style={{ marginTop: '6px', display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '11px', color: 'var(--text3)' }}>
                <span>Jaap count: <strong>{data.mantra?.count?.toLocaleString()}</strong></span>
                <span>Day: <strong>{data.mantra?.day}</strong></span>
                <span>Color to wear: <strong>{data.mantra?.color}</strong></span>
              </div>
            </div>
          </Section>

          {/* Fasting + Charity */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '14px' }}>
            <div style={{ padding: '10px 12px', background: 'var(--surface2)', borderRadius: '8px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
                🕯 Fasting (Vrat)
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text2)', lineHeight: 1.5 }}>{data.fasting}</div>
            </div>
            <div style={{ padding: '10px 12px', background: 'var(--surface2)', borderRadius: '8px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
                🤲 Charity (Daan)
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text2)', lineHeight: 1.5 }}>{data.charity}</div>
            </div>
          </div>

          {/* Deity */}
          <div style={{ marginTop: '10px', padding: '8px 12px', background: color + '0d', borderRadius: '8px', border: `1px solid ${color}22` }}>
            <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>🙏 Deity & Worship — </span>
            <span style={{ fontSize: '12px', color: 'var(--text2)' }}>{data.deity}</span>
          </div>

          {/* Yantra */}
          {data.yantra?.name && (
            <Section title="🔯 Yantra">
              <div style={{ padding: '10px 12px', background: 'var(--surface2)', borderRadius: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color }}>{data.yantra.name}</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text2)', marginTop: '4px', lineHeight: 1.6 }}>{data.yantra.description}</div>
              </div>
            </Section>
          )}

          {/* Lal Kitab */}
          {data.lal_kitab?.length > 0 && (
            <Section title="📕 Lal Kitab Remedies">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {data.lal_kitab.map((tip: string, i: number) => (
                  <div key={i} style={{ padding: '6px 10px', background: 'var(--surface2)', borderRadius: '6px', fontSize: '11.5px', color: 'var(--text2)', display: 'flex', gap: '8px' }}>
                    <span style={{ color, fontWeight: '700', flexShrink: 0 }}>{i + 1}.</span>
                    {tip}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Muhurta */}
          {data.muhurta_start && (
            <div style={{ marginTop: '10px', padding: '8px 12px', background: '#F0FDF4', borderRadius: '8px', border: '1px solid #16A34A40' }}>
              <span style={{ fontSize: '10px', fontWeight: '700', color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.07em' }}>🕐 Best Time to Start Remedy — </span>
              <span style={{ fontSize: '11.5px', color: '#16A34A' }}>{data.muhurta_start}</span>
            </div>
          )}
        </div>
      )}

      {open && data.priority === 'none' && (
        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: '12.5px', color: '#16A34A', lineHeight: 1.5 }}>
          ✓ This planet is strong in your chart. No remedies required. You may worship its deity for additional blessings.
          <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text3)' }}>🙏 {data.deity}</div>
        </div>
      )}
    </div>
  )
}

export default function RemediesPanel({ birthData }: Props) {
  const { lang } = useLang()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')

  useEffect(() => {
    if (!birthData) return
    setLoading(true)
    remediesApi.get(birthData)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [birthData])

  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>
      Calculating remedies…
    </div>
  )
  if (error) return (
    <div style={{ padding: '20px', color: 'var(--red)', fontSize: '13px' }}>{error}</div>
  )
  if (!data) return null

  const remedies = data.remedies as Record<string, any>
  const filtered = Object.entries(remedies).filter(([, d]: any) =>
    filter === 'all' || d.priority === filter
  )

  const counts = {
    high:   Object.values(remedies).filter((d: any) => d.priority === 'high').length,
    medium: Object.values(remedies).filter((d: any) => d.priority === 'medium').length,
    low:    Object.values(remedies).filter((d: any) => d.priority === 'low').length,
    none:   Object.values(remedies).filter((d: any) => d.priority === 'none').length,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header summary */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-m)', padding: '16px 20px',
        display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>Graha Shanti — Planetary Remedies</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
            Classical remedies based on planetary dignity in your chart
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[
            { key: 'high', label: 'Urgent', count: counts.high, color: '#DC2626' },
            { key: 'medium', label: 'Advised', count: counts.medium, color: '#D97706' },
            { key: 'low', label: 'Optional', count: counts.low, color: '#0891B2' },
            { key: 'none', label: 'Strong', count: counts.none, color: '#16A34A' },
          ].map(s => (
            <div key={s.key} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: '800', color: s.color }}>{s.count}</div>
              <div style={{ fontSize: '10px', color: 'var(--text3)', fontWeight: '600' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {(['all', 'high', 'medium', 'low'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border)',
            cursor: 'pointer', fontSize: '12px', fontWeight: '600',
            background: filter === f ? 'var(--accent)' : 'var(--surface)',
            color: filter === f ? '#fff' : 'var(--text3)',
            transition: 'all .15s',
          }}>
            {f === 'all' ? 'All Planets' : f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && <span style={{ marginLeft: '5px', opacity: 0.7 }}>({counts[f]})</span>}
          </button>
        ))}
      </div>

      {/* Planet cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.map(([planet, d]) => (
          <PlanetCard key={planet} planet={planet} data={d} lang={lang} />
        ))}
      </div>

      {/* Disclaimer */}
      <div style={{
        padding: '12px 16px', background: 'var(--surface2)',
        borderRadius: 'var(--radius-m)', border: '1px solid var(--border)',
        fontSize: '11.5px', color: 'var(--text3)', lineHeight: 1.6,
      }}>
        ⚠ {data.note}
      </div>
    </div>
  )
}
