/**
 * ShlokaCard — renders classical verse citations (Devanagari + IAST + translation + breakdown).
 * Additive: pulls verses from data/shlokas.ts by topic; shows nothing if none match.
 * Sanskrit is verbatim source text; translation/breakdown are trilingual (chosen language).
 */
import { useState } from 'react'
import { useLang } from '../contexts/LanguageContext'
import { getShlokas } from '../data/shlokas'

export default function ShlokaCard({ topics, accent = 'var(--accent)' }: { topics: string[]; accent?: string }) {
  const { t, lang } = useLang()
  const [open, setOpen] = useState(false)
  const shlokas = getShlokas(topics)
  if (shlokas.length === 0) return null

  return (
    <div style={{ marginTop: '10px', border: `1px solid ${accent}30`, borderRadius: '10px', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '9px 12px', background: `${accent}12`, border: 'none', cursor: 'pointer',
          fontSize: '12.5px', fontWeight: 800, color: accent, letterSpacing: '.02em',
        }}>
        <span style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
          📜 {t('Shloka')} · {t('Classical Source')} ({shlokas.length})
        </span>
        <span style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>▾</span>
      </button>

      {open && (
        <div style={{ padding: '4px 12px 12px' }}>
          {shlokas.map(s => (
            <div key={s.ref} style={{ padding: '10px 0', borderTop: '1px solid var(--border)' }}>
              {/* Verse (Devanagari) — verbatim source */}
              <div style={{
                fontFamily: "'Noto Sans Devanagari', serif", fontSize: '15px', lineHeight: 1.7,
                color: 'var(--text)', fontWeight: 600, marginBottom: '4px',
              }}>{s.devanagari} ॥</div>
              {/* IAST transliteration */}
              <div style={{ fontSize: '11.5px', fontStyle: 'italic', color: 'var(--text3)', marginBottom: '8px' }}>
                {s.iast}
              </div>
              {/* Translation (chosen language) */}
              <div style={{ fontSize: '13px', color: 'var(--text)', marginBottom: '6px' }}>
                <span style={{ fontWeight: 700, color: accent }}>{t('Translation')}: </span>
                {s.translation[lang] || s.translation.en}
              </div>
              {/* Breakdown (chosen language) */}
              <div style={{ fontSize: '12.5px', color: 'var(--text2)', lineHeight: 1.55 }}>
                <span style={{ fontWeight: 700, color: accent }}>{t('Breakdown')}: </span>
                {s.breakdown[lang] || s.breakdown.en}
              </div>
              {/* Citation */}
              <div style={{ fontSize: '10.5px', color: 'var(--text4)', marginTop: '6px' }}>
                — {s.ref} · {s.source}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
