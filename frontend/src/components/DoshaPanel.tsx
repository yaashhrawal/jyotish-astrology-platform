import { useState, useEffect } from 'react'
import { doshasApi } from '../api/client'
import { useLang } from '../contexts/LanguageContext'

const card: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-m)', padding: '20px',
}

function Dosha({ label, has, severity, color, children, t }: {
  label: string; has: boolean; severity?: string; color: string; children: React.ReactNode; t: (s: string) => string
}) {
  const [open, setOpen] = useState(has)
  return (
    <div style={{ ...card, borderLeft: `4px solid ${has ? color : 'var(--border)'}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: open ? '16px' : 0 }}
        onClick={() => setOpen(o => !o)}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
          background: has ? color + '18' : 'var(--surface2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px',
        }}>{has ? '⚠' : '✓'}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: has ? color : 'var(--text)' }}>{label}</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
            {has ? (severity ? `${t('Severity')}: ${severity}` : t('Present')) : t('Not present')}
          </div>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text4)' }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && children}
    </div>
  )
}

function Pills({ items, color }: { items: string[]; color?: string }) {
  if (!items?.length) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
      {items.map((item, i) => (
        <span key={i} style={{
          padding: '4px 10px', borderRadius: '6px', fontSize: '12px',
          background: color ? color + '12' : 'var(--surface2)',
          color: color || 'var(--text2)',
          border: `1px solid ${color ? color + '25' : 'var(--border)'}`,
        }}>{item}</span>
      ))}
    </div>
  )
}

function Section({ title, items, icon }: { title: string; items: string[]; icon?: string }) {
  if (!items?.length) return null
  return (
    <div style={{ marginTop: '12px' }}>
      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
        {icon} {title}
      </div>
      <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {items.map((r, i) => <li key={i} style={{ fontSize: '12.5px', color: 'var(--text2)', lineHeight: 1.5 }}>{r}</li>)}
      </ul>
    </div>
  )
}

interface Props { birthData: any }

export default function DoshaPanel({ birthData }: Props) {
  const { t } = useLang()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!birthData) return
    doshasApi.get(birthData).then(setData).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [birthData])

  if (loading) return <div style={{ padding: '20px', color: 'var(--text3)' }}>{t('Calculating doshas')}</div>
  if (error) return <div style={{ padding: '20px', color: 'var(--red)', fontSize: '13px' }}>{error}</div>
  if (!data) return null

  const { mangal_dosha: m, kalsarpa_dosha: k, sadesati: s, upagrahas: u } = data

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Summary bar */}
      <div style={{ ...card, display: 'flex', gap: '20px', flexWrap: 'wrap', background: 'var(--surface2)' }}>
        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', width: '100%', marginBottom: '4px' }}>
          {t('Dosha Summary')}
        </div>
        {[
          { label: t('Mangal Dosha'), has: m?.has_dosha, color: '#DC2626' },
          { label: t('Kalsarpa Dosha'), has: k?.has_dosha, color: '#7C3AED' },
          { label: t('Sadesati'), has: s?.in_sadesati, color: '#2563EB' },
        ].map(d => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.has ? d.color : '#16A34A' }} />
            <span style={{ fontSize: '13px', fontWeight: '600', color: d.has ? d.color : '#16A34A' }}>{d.label}</span>
            <span style={{ fontSize: '11px', color: 'var(--text4)' }}>{d.has ? t('Present') : t('Absent')}</span>
          </div>
        ))}
      </div>

      {/* Mangal Dosha */}
      <Dosha label={t('Mangal Dosha')} has={m?.has_dosha} severity={m?.severity} color="#DC2626" t={t}>
        <div style={{ fontSize: '12.5px', color: 'var(--text2)', lineHeight: 1.6 }}>
          Mars in <strong>{m?.mars_sign}</strong> · H{m?.mars_house_from_lagna} from Lagna
          {m?.mars_house_from_moon && ` · H${m?.mars_house_from_moon} from Moon`}
          {m?.mars_house_from_venus && ` · H${m?.mars_house_from_venus} from Venus`}
        </div>
        <Pills items={m?.triggers} color="#DC2626" />
        {m?.cancellations?.length > 0 && (
          <div style={{ marginTop: '10px', padding: '8px 12px', background: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0', fontSize: '12px', color: '#166534' }}>
            ✓ Cancellation factors: {m.cancellations.join(' · ')}
          </div>
        )}
        <Section title={t('Remedies')} items={m?.remedies} icon="🙏" />
      </Dosha>

      {/* Kalsarpa Dosha */}
      <Dosha label={t('Kalsarpa Dosha')} has={k?.has_dosha} color="#7C3AED" t={t}>
        {k?.has_dosha && (
          <>
            <div style={{ fontSize: '12.5px', color: 'var(--text2)', lineHeight: 1.6 }}>
              <strong>{k?.type} Kalsarpa</strong> · {k?.direction}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '6px' }}>
              Rahu in <strong>{k?.rahu_sign}</strong> · Ketu in <strong>{k?.ketu_sign}</strong>
            </div>
            <Section title={t('Effects')} items={k?.effects} icon="🐍" />
            <Section title={t('Remedies')} items={k?.remedies} icon="🙏" />
          </>
        )}
        {!k?.has_dosha && k?.is_partial && (
          <div style={{ fontSize: '12.5px', color: 'var(--text2)' }}>
            Partial Kalsarpa — 5+ planets hemmed. Milder effects apply.
          </div>
        )}
        {k?.exception_breaks_dosha && (
          <div style={{ marginTop: '8px', padding: '8px 12px', background: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0', fontSize: '12px', color: '#166534' }}>
            ✓ Planet conjunct Rahu/Ketu breaks the dosha
          </div>
        )}
      </Dosha>

      {/* Sadesati */}
      <Dosha label={t('Sadesati')} has={s?.in_sadesati} color="#2563EB" t={t}>
        <div style={{ fontSize: '12.5px', color: 'var(--text2)', lineHeight: 1.6 }}>
          Natal Moon: <strong>{s?.moon_sign}</strong> · Saturn now in <strong>{s?.saturn_current_sign}</strong>
        </div>
        {s?.in_sadesati && (
          <div style={{ marginTop: '10px', padding: '10px 14px', background: 'var(--accent-bg)', borderRadius: '8px', border: '1px solid rgba(87,70,175,.2)', fontSize: '12.5px', color: 'var(--accent)', fontWeight: '600' }}>
            {s?.current_phase}
          </div>
        )}
        <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {s?.sadesati_signs?.map((sign: string, i: number) => (
            <span key={i} style={{
              padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
              background: sign === s?.saturn_current_sign ? '#2563EB' : 'var(--surface2)',
              color: sign === s?.saturn_current_sign ? '#fff' : 'var(--text3)',
              border: '1px solid var(--border)',
            }}>{['Rising', 'Peak', 'Setting'][i]}: {sign}</span>
          ))}
        </div>
        <Section title={t('Effects')} items={s?.effects} icon="⏳" />
        <Section title={t('Remedies')} items={s?.remedies} icon="🙏" />
        {s?.note && <div style={{ marginTop: '10px', fontSize: '11.5px', color: 'var(--text4)' }}>{s.note}</div>}
      </Dosha>

      {/* Upagrahas */}
      <div style={card}>
        <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '14px' }}>{t('Upagrahas Shadow')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            { name: 'Gulika', data: u?.gulika, color: '#57534E' },
            { name: 'Mandi', data: u?.mandi, color: '#78716C' },
          ].map(({ name, data: ud, color }) => ud && (
            <div key={name} style={{ padding: '12px 14px', background: 'var(--surface2)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color, marginBottom: '4px' }}>{name}</div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>{ud.sign} {ud.degree}° · H{ud.house}</div>
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px', lineHeight: 1.5 }}>{ud.significance}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
