import { useState, useRef, useEffect } from 'react'
import { aiApi } from '../api/client'
import { useLang } from '../contexts/LanguageContext'

const SUGGESTIONS_EN = [
  'What does Jupiter in 7th house mean?',
  'Explain Ruchaka Mahapurusha Yoga',
  'How to interpret Vargottama planets?',
  'What is Neecha Bhanga Raja Yoga?',
  'Which dashas favor career growth?',
]
const SUGGESTIONS_HI = [
  'सप्तम भाव में बृहस्पति का क्या अर्थ है?',
  'रुचक महापुरुष योग समझाएं',
  'वर्गोत्तम ग्रहों का फलित कैसे करें?',
  'नीच भंग राज योग क्या है?',
  'करियर के लिए कौन सी दशा अनुकूल है?',
]
const SUGGESTIONS_SA = [
  'सप्तमे भावे बृहस्पतिः किं फलम् ददाति?',
  'रुचकमहापुरुषयोगं विवृणोतु',
  'वर्गोत्तमग्रहाणां फलितं कथम्?',
  'नीचभङ्गराजयोगः कः?',
  'जीविकार्थं का दशा अनुकूला?',
]

interface Message { role: 'user' | 'ai'; text: string }
interface Props { chartId?: string; chartName?: string }

export default function AIChat({ chartId, chartName }: Props) {
  const { lang, t } = useLang()
  const SUGGESTIONS = lang === 'hi' ? SUGGESTIONS_HI : lang === 'sa' ? SUGGESTIONS_SA : SUGGESTIONS_EN
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: chartId
        ? `Chart loaded: **${chartName}**. Ask me anything about this chart — planetary placements, yogas, dasha periods, or classical interpretations.`
        : 'Namaste! I am Grahika AI, trained on BPHS, Phaladeepika, Saravali and other classical texts. Ask me anything about Vedic astrology — chart interpretation, yogas, dashas, or classical rules.'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'interpret' | 'research'>('interpret')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async (text?: string) => {
    const q = text || input.trim()
    if (!q || loading) return
    setInput('')
    setMessages(m => [...m, { role: 'user', text: q }])
    setLoading(true)
    try {
      const r: any = mode === 'research' ? await aiApi.research(q) : await aiApi.interpret(q, chartId)
      setMessages(m => [...m, { role: 'ai', text: r.answer }])
    } catch (e: any) {
      const msg = e?.response?.data?.detail || 'AI unavailable. Set ANTHROPIC_API_KEY on backend.'
      setMessages(m => [...m, { role: 'ai', text: `Error: ${msg}` }])
    }
    setLoading(false)
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '620px',
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-l)', overflow: 'hidden',
      boxShadow: 'var(--shadow-s)',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: '10px',
        background: 'var(--surface2)',
      }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '10px',
          background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', color: '#fff', flexShrink: 0,
        }}>✦</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '700', fontSize: '14px' }}>Grahika AI</div>
          <div style={{ color: 'var(--text3)', fontSize: '11px' }}>
            {chartId ? `${t('Chart Analysis')}: ${chartName}` : 'BPHS · Phaladeepika · Saravali'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['interpret', 'research'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding: '5px 12px', borderRadius: 'var(--radius-s)', border: '1px solid var(--border)',
              cursor: 'pointer', fontSize: '12px', fontWeight: '500',
              background: mode === m ? 'var(--accent)' : 'var(--surface)',
              color: mode === m ? '#fff' : 'var(--text3)',
              transition: 'all .15s',
            }}>{m === 'interpret' ? t('Chart Analysis') : t('Research')}</button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map((m, i) => (
          <div key={i} style={m.role === 'user' ? {
            alignSelf: 'flex-end', background: 'var(--accent)', color: '#fff',
            padding: '10px 14px', borderRadius: '12px 12px 2px 12px',
            maxWidth: '70%', fontSize: '13px', lineHeight: '1.5',
          } : {
            alignSelf: 'flex-start', background: 'var(--surface2)', border: '1px solid var(--border)',
            color: 'var(--text)', padding: '14px 16px', borderRadius: '12px 12px 12px 2px',
            maxWidth: '90%', fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-wrap',
          }}>
            {m.text}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', color: 'var(--text3)', fontSize: '13px', fontStyle: 'italic' }}>
            {t('Thinking')}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick suggestions */}
      {messages.length === 1 && (
        <div style={{ padding: '0 20px 12px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => send(s)} style={{
              padding: '6px 12px', background: 'var(--surface2)',
              border: '1px solid var(--border)', borderRadius: '20px',
              color: 'var(--text2)', cursor: 'pointer', fontSize: '12px',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>{s}</button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px', background: 'var(--surface2)' }}>
        <textarea
          style={{
            flex: 1, padding: '10px 14px', background: 'var(--surface)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-m)',
            color: 'var(--text)', fontSize: '13px', resize: 'none',
            fontFamily: 'inherit', outline: 'none',
          }}
          rows={2}
          placeholder={mode === 'research' ? t('AI Placeholder Research') : t('AI Placeholder Chart')}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
        />
        <button style={{
          padding: '10px 18px', background: 'var(--accent)', border: 'none',
          borderRadius: 'var(--radius-m)', color: '#fff', cursor: 'pointer',
          fontWeight: '600', fontSize: '13px', alignSelf: 'flex-end',
          opacity: loading || !input.trim() ? 0.5 : 1,
        }} onClick={() => send()} disabled={loading || !input.trim()}>{t('Send')}</button>
      </div>
    </div>
  )
}
