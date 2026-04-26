import { useEffect, useState } from 'react'
import { getCurrentSky } from '../api/jyotish'
import type { SkyResponse } from '../api/jyotish'
import { useLang } from '../contexts/LanguageContext'
import { translate } from '../i18n/terms'

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#B45309', Venus: '#7C3AED', Saturn: '#2563EB', Rahu: '#57534E', Ketu: '#A8A29E'
}

export default function LiveSky() {
  const { lang, t } = useLang()
  const [sky, setSky] = useState<SkyResponse | null>(null)

  useEffect(() => {
    const load = () => getCurrentSky().then(setSky).catch(() => {})
    load()
    const timer = setInterval(load, 60000)
    return () => clearInterval(timer)
  }, [])

  if (!sky) return (
    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>
      {t('Loading sky data')}
    </div>
  )

  const planets = Object.entries(sky.planets)

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface2)' }}>
        <div style={{ fontWeight: '700', fontSize: '14px' }}>☽ {t('Current Sky')}</div>
        <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{t('Updates every minute')}</div>
      </div>

      {/* Tithi / Hora / Nakshatra cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', background: 'var(--border)', borderBottom: '1px solid var(--border)' }}>
        {[
          { label: t('Tithi'), value: translate(sky.tithi.name, lang) },
          { label: t('Hora Lord'), value: translate(sky.hora_lord, lang) },
          { label: t('Nakshatra'), value: translate(sky.current_nakshatra, lang) },
        ].map(item => (
          <div key={item.label} style={{ padding: '14px 16px', background: 'var(--surface)', textAlign: 'center' }}>
            <div style={{ fontSize: '10.5px', color: 'var(--text3)', fontWeight: '500', marginBottom: '4px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{item.label}</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)' }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Planet rows */}
      <div>
        {planets.map(([name, p], idx) => (
          <div key={name} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '9px 20px',
            borderBottom: idx < planets.length - 1 ? '1px solid var(--border)' : 'none',
            background: idx % 2 === 0 ? 'var(--surface)' : 'var(--surface2)',
            transition: 'background .1s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? 'var(--surface)' : 'var(--surface2)')}
          >
            <span style={{ width: '26px', fontSize: '12px', fontWeight: '700', color: PLANET_COLORS[name] || 'var(--text3)', flexShrink: 0 }}>
              {translate(name, lang).slice(0, 2)}
            </span>
            <span style={{ flex: 1, fontSize: '13px', color: 'var(--text)' }}>
              {translate(p.sign, lang)}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text2)', fontVariantNumeric: 'tabular-nums', width: '48px' }}>
              {p.degree.toFixed(1)}°
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text3)', width: '100px', textAlign: 'right' }}>
              {translate(p.nakshatra, lang)}
            </span>
            {p.retrograde && (
              <span style={{ fontSize: '10px', color: 'var(--red)', fontWeight: '600', width: '20px' }}>(R)</span>
            )}
            {p.status && p.status !== 'neutral' && (
              <span style={{
                fontSize: '10px', padding: '2px 7px', borderRadius: '20px', fontWeight: '600',
                background: p.status === 'exalted' ? 'var(--green-bg)' : p.status === 'debilitated' ? 'var(--red-bg)' : 'var(--accent-bg)',
                color: p.status === 'exalted' ? 'var(--green)' : p.status === 'debilitated' ? 'var(--red)' : 'var(--accent)',
              }}>
                {p.status === 'exalted' ? '↑ EX' : p.status === 'debilitated' ? '↓ DEB' : 'OWN'}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
