import { useState, useEffect } from 'react'
import { panchangaApi } from '../api/client'
import { useLang } from '../contexts/LanguageContext'

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#B45309', Venus: '#7C3AED', Saturn: '#2563EB', Rahu: '#57534E', Ketu: '#A8A29E'
}

interface Props { birthData: any }

export default function PanchangaCard({ birthData }: Props) {
  const { t } = useLang()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!birthData) return
    panchangaApi.get(birthData).then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [birthData])

  if (loading) return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px 20px' }}>
      <div style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Panchanga</div>
      <div style={{ fontSize: '12.5px', color: 'var(--text3)', marginTop: '8px' }}>Loading…</div>
    </div>
  )

  if (!data) return null

  const items = [
    {
      label: t('Tithi'),
      value: `${t(data.tithi?.paksha)} ${t(data.tithi?.name)}`,
      sub: `#${data.tithi?.number}`,
      color: data.tithi?.number <= 15 ? '#0891B2' : '#57534E',
    },
    {
      label: t('Vara'),
      value: t(data.vara?.day),
      sub: `${t('Lord')}: ${t(data.vara?.lord)}`,
      color: PLANET_COLORS[data.vara?.lord] || 'var(--accent)',
    },
    {
      label: t('Nakshatra'),
      value: t(data.nakshatra?.name),
      sub: `${t('Pada')} ${data.nakshatra?.pada} · ${t('Lord')}: ${t(data.nakshatra?.lord)}`,
      color: PLANET_COLORS[data.nakshatra?.lord] || 'var(--accent)',
    },
    {
      label: t('Yoga'),
      value: t(data.yoga?.name),
      sub: data.yoga?.inauspicious ? `⚠ ${t('Inauspicious')}` : `✓ ${t('Auspicious')}`,
      color: data.yoga?.inauspicious ? '#DC2626' : '#16A34A',
    },
    {
      label: t('Karana'),
      value: t(data.karana?.name),
      sub: data.karana?.inauspicious ? `⚠ ${t('Inauspicious')}` : `✓ ${t('Auspicious')}`,
      color: data.karana?.inauspicious ? '#DC2626' : '#16A34A',
    },
    {
      label: t('Hora'),
      value: `${t(data.hora?.lord)} ${t('Hora')}`,
      sub: 'Current hour lord',
      color: PLANET_COLORS[data.hora?.lord] || 'var(--accent)',
    },
  ]

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)' }}>पञ्चाङ्ग · Panchanga</div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>Five limbs of the day</div>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text4)' }}>{data.date}</div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--border)' }}>
        {items.map(item => (
          <div key={item.label} style={{ background: 'var(--surface)', padding: '14px 16px' }}>
            <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>
              {item.label}
            </div>
            <div style={{ fontSize: '13.5px', fontWeight: '700', color: item.color, lineHeight: 1.2, marginBottom: '3px' }}>
              {item.value}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{item.sub}</div>
          </div>
        ))}
      </div>

      {/* Moon phase indicator */}
      <div style={{ padding: '10px 18px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--surface2)' }}>
        <span style={{ fontSize: '18px' }}>{data.moon?.is_waxing ? '🌔' : '🌖'}</span>
        <div style={{ fontSize: '12px', color: 'var(--text2)' }}>
          <strong>{data.tithi?.paksha === 'Shukla' ? 'Waxing Moon (Shukla Paksha)' : 'Waning Moon (Krishna Paksha)'}</strong>
          <span style={{ color: 'var(--text3)', marginLeft: '8px' }}>Moon at {data.moon?.longitude?.toFixed(2)}°</span>
        </div>
      </div>

      {/* Hora schedule — sunrise-based, Chaldean order */}
      {data.hora?.schedule && (
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              {t('Planetary Hours (Hora)')}
            </span>
            {(data.hora.sunrise || data.hora.sunset) && (
              <span style={{ fontSize: '10px', color: 'var(--text4)' }}>
                ☀ {t('Sunrise')} {data.hora.sunrise} · {t('Sunset')} {data.hora.sunset}
              </span>
            )}
          </div>
          {(['day', 'night'] as const).map(part => {
            const rows = data.hora.schedule.filter((h: any) => part === 'night' ? h.is_night : !h.is_night)
            if (!rows.length) return null
            return (
              <div key={part} style={{ marginBottom: part === 'day' ? '8px' : 0 }}>
                <div style={{ fontSize: '9px', color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                  {part === 'day' ? `🌞 ${t('Day')}` : `🌙 ${t('Night')}`}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {rows.map((h: any) => {
                    const c = PLANET_COLORS[h.lord] || '#888'
                    return (
                      <div key={h.index} title={`${h.start}–${h.end}`} style={{
                        padding: '4px 8px', borderRadius: '6px', fontSize: '10.5px',
                        background: h.current ? c + '25' : 'var(--surface2)',
                        border: h.current ? `1.5px solid ${c}` : '1px solid var(--border)',
                        minWidth: '52px', textAlign: 'center',
                      }}>
                        <div style={{ fontSize: '9px', color: 'var(--text4)' }}>{h.start}</div>
                        <div style={{ fontWeight: '700', color: h.current ? c : 'var(--text3)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(h.lord).slice(0, 3)}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
