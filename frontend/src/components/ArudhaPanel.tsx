import { useState, useEffect } from 'react'
import { arudhaApi } from '../api/client'
import { useLang } from '../contexts/LanguageContext'

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#B45309', Venus: '#7C3AED', Saturn: '#2563EB', Rahu: '#57534E', Ketu: '#A8A29E'
}

const SIGN_MEANINGS: Record<number, string> = {
  1: 'Self, personality, body', 2: 'Wealth, speech, family', 3: 'Courage, siblings, efforts',
  4: 'Mother, home, comforts', 5: 'Children, intelligence, romance', 6: 'Enemies, disease, debts',
  7: 'Spouse, partnerships, business', 8: 'Longevity, occult, transformation',
  9: 'Father, dharma, fortune', 10: 'Career, status, karma', 11: 'Income, gains, friends',
  12: 'Loss, liberation, foreign lands',
}

interface Props { birthData: any }

export default function ArudhaPanel({ birthData }: Props) {
  const { t } = useLang()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!birthData) return
    setLoading(true)
    arudhaApi.get(birthData)
      .then(setData).catch(e => setError(e.response?.data?.detail || e.message))
      .finally(() => setLoading(false))
  }, [birthData])

  if (loading) return <div style={{ padding: '20px', color: 'var(--text3)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Computing Arudha Lagnas…')}</div>
  if (error) return <div style={{ padding: '12px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#DC2626', fontSize: '13px' }}>{error}</div>
  if (!data) return null

  const highlighted = [1, 4, 7, 10, 12]  // AL, A4, A7, A10, UL

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '4px', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Arudha Lagnas')} — {t('Jaimini System')}</div>
        <div style={{ fontSize: '12px', color: 'var(--text3)', lineHeight: 1.5 }}>
          Lagna: <strong style={{ color: 'var(--text)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(data.ascendant?.sign)} {data.ascendant?.degree?.toFixed(1)}°</strong>
          {' · '}Arudha Lagna (AL) = the world's perception of you vs your true self.
        </div>
      </div>

      {/* Upapada + Special lagnas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
        {/* Upapada */}
        <div style={{ background: 'var(--accent-bg)', border: '1px solid rgba(87,70,175,.2)', borderRadius: '12px', padding: '16px', gridColumn: 'span 1' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Upapada Lagna (UL)</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(data.upapada?.sign)}</div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>H{data.upapada?.bhava} from Lagna</div>
          <div style={{ fontSize: '10.5px', color: 'var(--text4)', marginTop: '6px', lineHeight: 1.5 }}>
            Lord: <span style={{ color: PLANET_COLORS[data.upapada?.lord] || 'var(--text)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(data.upapada?.lord)}</span>
            {data.upapada?.planets_here?.length > 0 && ` · Planets: ${data.upapada.planets_here.join(', ')}`}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text4)', marginTop: '4px' }}>Indicates spouse/marriage karma</div>
        </div>

        {/* Special lagnas */}
        {[
          { key: 'hora_lagna', label: 'Hora Lagna (HL)', sub: 'Wealth & finances' },
          { key: 'ghati_lagna', label: 'Ghati Lagna (GL)', sub: 'Power & authority' },
          { key: 'varnada_lagna', label: 'Varnada Lagna (VL)', sub: 'Longevity' },
        ].map(item => {
          const sl = data.special_lagnas?.[item.key]
          return sl ? (
            <div key={item.key} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(item.label)}</div>
              <div style={{ fontSize: '18px', fontWeight: '800', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(sl.sign)}</div>
              <div style={{ fontSize: '10px', color: 'var(--text4)', marginTop: '4px' }}>{item.sub}</div>
            </div>
          ) : null
        })}
      </div>

      {/* All 12 Arudhas grid */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontSize: '13px', fontWeight: '700', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
          {t('All 12 Arudha Lagnas')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--border)' }}>
          {data.arudhas?.map((a: any) => {
            const isImportant = highlighted.includes(a.house)
            return (
              <div key={a.house} style={{
                background: isImportant ? 'var(--accent-bg)' : 'var(--surface)',
                padding: '14px 16px',
                borderLeft: isImportant ? '3px solid var(--accent)' : '3px solid transparent',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '20px',
                    background: isImportant ? 'var(--accent)' : 'var(--surface2)',
                    color: isImportant ? '#fff' : 'var(--text3)',
                  }}>{a.code}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: '600' }}>H{a.house}</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: isImportant ? 'var(--accent)' : 'var(--text)', marginBottom: '2px', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {t(a.sign)}
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--text3)', marginBottom: '4px', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  Bhava {a.bhava} · Lord: <span style={{ color: PLANET_COLORS[a.lord] || 'var(--text)' }}>{t(a.lord)}</span>
                  <span style={{ color: 'var(--text4)' }}> in {t(a.lord_sign)}</span>
                </div>
                {a.planets_here?.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {a.planets_here.map((p: string) => (
                      <span key={p} style={{ fontSize: '9px', fontWeight: '700', padding: '1px 5px', borderRadius: '8px',
                        background: (PLANET_COLORS[p] || '#888') + '18', color: PLANET_COLORS[p] || 'var(--text)' }}>{p.slice(0,2)}</span>
                    ))}
                  </div>
                )}
                <div style={{ fontSize: '9.5px', color: 'var(--text4)', marginTop: '4px', lineHeight: 1.4 }}>
                  {SIGN_MEANINGS[a.house] || ''}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Arudha interpretation guide */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px' }}>
        <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '10px', color: 'var(--text3)' }}>Key Arudha Combinations</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11.5px', color: 'var(--text3)', lineHeight: 1.7 }}>
          <div>• <strong>AL in Kendra/Trikona</strong> → Strong public image</div>
          <div>• <strong>A7 = AL sign</strong> → Spouse from same social circle</div>
          <div>• <strong>UL lord exalted</strong> → Excellent marriage prospects</div>
          <div>• <strong>A10 with benefics</strong> → Fame in career</div>
          <div>• <strong>A6 strong</strong> → Public enemies visible</div>
          <div>• <strong>A11 with AL</strong> → Financial gains from social role</div>
        </div>
      </div>
    </div>
  )
}
