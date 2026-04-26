import { useLang } from '../contexts/LanguageContext'
import type { Lang } from '../i18n/terms'

const OPTIONS: { lang: Lang; label: string; title: string }[] = [
  { lang: 'en', label: 'EN',        title: 'English' },
  { lang: 'hi', label: 'हिंदी',    title: 'Hindi' },
  { lang: 'sa', label: 'संस्कृत', title: 'Sanskrit (Devanagari)' },
]

export default function LanguageToggle() {
  const { lang, setLang } = useLang()
  return (
    <div style={{
      display: 'flex',
      border: '1px solid var(--border)',
      borderRadius: 8,
      overflow: 'hidden',
      fontFamily: "'Noto Sans Devanagari', 'Mangal', sans-serif",
    }}>
      {OPTIONS.map(opt => (
        <button
          key={opt.lang}
          title={opt.title}
          onClick={() => setLang(opt.lang)}
          style={{
            padding: '5px 11px',
            border: 'none',
            cursor: 'pointer',
            fontSize: opt.lang === 'en' ? 11 : 13,
            fontWeight: 700,
            fontFamily: opt.lang === 'en' ? 'inherit' : "'Noto Sans Devanagari', 'Mangal', sans-serif",
            background: lang === opt.lang ? 'var(--accent)' : 'var(--surface2)',
            color: lang === opt.lang ? '#fff' : 'var(--text3)',
            transition: 'background 0.15s, color 0.15s',
            lineHeight: 1.3,
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
