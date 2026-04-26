import { useState } from 'react'
import { useAuth } from '../store/auth'
import { useLang } from '../contexts/LanguageContext'

const S = {
  overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  box: { background: '#0f1923', border: '1px solid #2a4a6b', borderRadius: '12px', padding: '32px', width: '380px' },
  title: { color: '#4a9eff', fontSize: '22px', fontWeight: 'bold', marginBottom: '24px', textAlign: 'center' as const },
  input: { width: '100%', padding: '10px 14px', background: '#07111a', border: '1px solid #2a4a6b', borderRadius: '6px', color: '#e0e0e0', fontSize: '14px', boxSizing: 'border-box' as const, marginBottom: '12px' },
  btn: { width: '100%', padding: '12px', background: '#4a9eff', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' },
  err: { color: '#E74C3C', fontSize: '13px', marginBottom: '12px', padding: '8px', background: '#1a0a0a', borderRadius: '6px' },
  toggle: { color: '#4a6fa5', fontSize: '13px', textAlign: 'center' as const, marginTop: '16px', cursor: 'pointer' },
}

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const { t } = useLang()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()

  const submit = async () => {
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') await login(email, password)
      else await register(email, password, name)
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.box}>
        <div style={S.title}>✦ Jyotish {mode === 'login' ? t('Sign In') : t('Create Account')}</div>
        {error && <div style={S.err}>{error}</div>}
        {mode === 'register' && (
          <input style={S.input} placeholder={t('Full Name')} value={name} onChange={e => setName(e.target.value)} />
        )}
        <input style={S.input} placeholder={t('Email')} type="email" value={email} onChange={e => setEmail(e.target.value)} />
        <input style={S.input} placeholder={t('Password')} type="password" value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()} />
        <button style={S.btn} onClick={submit} disabled={loading}>
          {loading ? t('Please wait') : mode === 'login' ? t('Sign In') : t('Create Account')}
        </button>
        <div style={S.toggle} onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? t('No account') : t('Have account')}
        </div>
      </div>
    </div>
  )
}
