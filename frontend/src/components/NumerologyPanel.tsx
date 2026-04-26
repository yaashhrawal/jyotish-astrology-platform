import { useState } from 'react'
import { numerologyApi } from '../api/client'

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Jupiter: '#B45309', Rahu: '#57534E',
  Mercury: '#16A34A', Venus: '#7C3AED', Ketu: '#A8A29E', Saturn: '#2563EB', Mars: '#DC2626',
}

const NUM_COLORS = ['','#D97706','#0891B2','#B45309','#57534E','#16A34A','#7C3AED','#A8A29E','#2563EB','#DC2626']

export default function NumerologyPanel() {
  const [form, setForm] = useState({ day: '', month: '', year: '', name: '' })
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const compute = async () => {
    if (!form.day || !form.month || !form.year) { setErr('Enter day, month and year'); return }
    setErr(''); setLoading(true)
    try {
      const res = await numerologyApi.get({
        day: parseInt(form.day), month: parseInt(form.month),
        year: parseInt(form.year), name: form.name,
      })
      setData(res)
    } catch (e: any) { setErr(e?.response?.data?.detail || 'Error') }
    finally { setLoading(false) }
  }

  const NumBadge = ({ n, size = 56 }: { n: number; size?: number }) => (
    <div style={{
      width: size, height: size, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: NUM_COLORS[n] || '#888', color: '#fff', fontSize: size * 0.4, fontWeight: '900',
      boxShadow: `0 2px 10px ${NUM_COLORS[n] || '#888'}55`, flexShrink: 0,
    }}>{n}</div>
  )

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-m)', padding: '14px 16px' }}>
      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>{title}</div>
      {children}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-m)' }}>
        <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>Vedic Numerology</div>
        <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
          Moolank · Bhagyank · Name Numbers · Lucky Days · Karmic Debt
        </div>
      </div>

      {/* Input */}
      <div style={{ display: 'grid', gridTemplateColumns: '80px 80px 100px 1fr auto', gap: '8px', alignItems: 'end' }}>
        {[
          { label: 'Day', key: 'day', ph: '14' },
          { label: 'Month', key: 'month', ph: '8' },
          { label: 'Year', key: 'year', ph: '1990' },
          { label: 'Full Name (optional)', key: 'name', ph: 'e.g. Rama Devi' },
        ].map(({ label, key, ph }) => (
          <div key={key}>
            <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
            <input
              value={(form as any)[key]}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && compute()}
              placeholder={ph}
              style={{ width: '100%', padding: '9px 10px', borderRadius: 'var(--radius-m)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>
        ))}
        <button onClick={compute} disabled={loading} style={{ padding: '9px 20px', borderRadius: 'var(--radius-m)', border: 'none', background: 'var(--accent)', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer', height: '38px' }}>
          {loading ? '…' : 'Calculate'}
        </button>
      </div>
      {err && <div style={{ fontSize: '12px', color: '#DC2626' }}>{err}</div>}

      {data && (
        <>
          {/* Moolank + Bhagyank big cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { key: 'moolank', d: data.moolank },
              { key: 'bhagyank', d: data.bhagyank },
            ].map(({ key, d }) => {
              const pColor = PLANET_COLORS[d.planet] || '#888'
              return (
                <div key={key} style={{ background: 'var(--surface)', border: `2px solid ${pColor}33`, borderRadius: 'var(--radius-m)', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                    <NumBadge n={d.number} size={52} />
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{d.label}</div>
                      <div style={{ fontSize: '18px', fontWeight: '900', color: NUM_COLORS[d.number] || '#888' }}>{d.keyword}</div>
                      <div style={{ fontSize: '11px', color: pColor, fontWeight: '600' }}>🪐 {d.planet}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text2)', fontStyle: 'italic', marginBottom: '8px' }}>{d.life_theme}</div>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    {d.positive_traits.map((t: string) => (
                      <span key={t} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: '#16A34A18', color: '#16A34A', border: '1px solid #16A34A40' }}>{t}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {d.negative_traits.map((t: string) => (
                      <span key={t} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: '#DC262618', color: '#DC2626', border: '1px solid #DC262640' }}>{t}</span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Karmic debt */}
          {data.karmic_debt && (
            <div style={{ padding: '10px 14px', background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 'var(--radius-m)', fontSize: '12px', color: '#92400E' }}>
              ⚠ <strong>Karmic Debt Number {data.karmic_debt_number}</strong> — this birth carries karmic lessons requiring extra effort and discipline in this lifetime.
            </div>
          )}

          {/* Name analysis */}
          {data.name_analysis && (
            <Section title="Name Numbers">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { label: 'Expression (Name)', val: data.name_analysis.expression_number },
                  { label: 'Soul Urge (Vowels)', val: data.name_analysis.soul_urge },
                  { label: 'Personality (Consonants)', val: data.name_analysis.personality },
                ].map(({ label, val }) => val && (
                  <div key={label} style={{ textAlign: 'center', padding: '10px 8px', background: 'var(--surface2)', borderRadius: '8px' }}>
                    <NumBadge n={val} size={40} />
                    <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '6px' }}>{label}</div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text)' }}>
                      {PLANET_COLORS[data.name_analysis.planet] ? data.name_analysis.planet : ''}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Lucky */}
          <Section title="Lucky Influences">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '6px', textTransform: 'uppercase' }}>Lucky Numbers</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {data.lucky.numbers.map((n: number) => (
                    <div key={n} style={{ width: 32, height: 32, borderRadius: '50%', background: NUM_COLORS[n] || '#888', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700' }}>{n}</div>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '6px', textTransform: 'uppercase' }}>Lucky Days</div>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  {data.lucky.days.map((d: string) => (
                    <span key={d} style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' }}>{d}</span>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '6px', textTransform: 'uppercase' }}>Lucky Colors</div>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  {data.lucky.colors.map((c: string) => (
                    <span key={c} style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' }}>{c}</span>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '6px', textTransform: 'uppercase' }}>Lucky Gem</div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)' }}>💎 {data.lucky.gem}</span>
              </div>
            </div>
          </Section>

          {/* Personal Year */}
          <div style={{ padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-m)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <NumBadge n={data.personal_year} size={40} />
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Personal Year ({data.input.year})</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)' }}>{NUMBER_TRAITS_FRONTEND[data.personal_year]?.keyword || data.personal_year}</div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const NUMBER_TRAITS_FRONTEND: Record<number, { keyword: string }> = {
  1: { keyword: 'New Beginnings — Plant seeds, start ventures' },
  2: { keyword: 'Cooperation — Build relationships, be patient' },
  3: { keyword: 'Creativity — Express yourself, expand socially' },
  4: { keyword: 'Hard Work — Build foundations, stay grounded' },
  5: { keyword: 'Change — Embrace freedom, travel, transitions' },
  6: { keyword: 'Responsibility — Home, family, service to others' },
  7: { keyword: 'Reflection — Seek wisdom, rest, inner growth' },
  8: { keyword: 'Harvest — Career, money, recognition come' },
  9: { keyword: 'Completion — Release the old, prepare for renewal' },
  11: { keyword: 'Master 11 — Spiritual awakening, inspiration' },
  22: { keyword: 'Master 22 — Build something great and lasting' },
  33: { keyword: 'Master 33 — Teacher, healer, compassion in action' },
}
