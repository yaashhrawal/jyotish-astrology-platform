import { useState } from 'react'
import { useAuth } from '../store/auth'
import { useLang } from '../contexts/LanguageContext'
import type { UserRole } from '../api/client'

/**
 * Full-screen auth page (shown on demand, not a forced gate).
 * Register is 2 steps: (1) name/email/phone/password, (2) occupation choice.
 * onClose returns to the app (guests keep using it without an account).
 * Google sign-in button is UI-only for now (wired later).
 */
export default function AuthPage({ onClose }: { onClose: () => void }) {
  const { t } = useLang()
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [step, setStep] = useState<1 | 2>(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('astrologer')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const doLogin = async () => {
    setError(''); setLoading(true)
    try { await login(email, password); onClose() }
    catch (e: any) { setError(e?.response?.data?.detail || t('Invalid credentials')) }
    finally { setLoading(false) }
  }

  const doRegister = async () => {
    setError(''); setLoading(true)
    try { await register(email, password, name, phone, role); onClose() }
    catch (e: any) { setError(e?.response?.data?.detail || t('Error occurred')) }
    finally { setLoading(false) }
  }

  const googleBtn = (
    <>
      <button style={S.googleBtn} onClick={() => setError(t('Google sign-in coming soon'))}>
        <span style={S.gIcon}>G</span>{t('Continue with Google')}
      </button>
      <div style={S.divider}><span style={S.divLine} /><span style={S.divText}>{t('or')}</span><span style={S.divLine} /></div>
    </>
  )

  const goStep2 = () => {
    setError('')
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError(t('Please fill all fields')); return
    }
    setStep(2)
  }

  return (
    <div style={S.wrap}>
      <div style={S.center}>
        <div style={S.brand}>
          <span style={S.logoBox}>✦</span>
          <span style={S.wordmark}>
            <span style={{ fontFamily: 'serif' }}>Jyo</span>
            <span style={{ color: 'var(--accent)', fontFamily: 'serif' }}>·</span>
            <span style={{ fontFamily: "'Noto Sans Devanagari', serif" }}>तिष</span>
          </span>
        </div>
        <div style={S.shloka}>वेदस्य निर्मलं चक्षुः ज्योतिषं मुनिसत्तमाः</div>
        <div style={S.tagline}>{t('Sub-arcsecond planetary positions · 16 divisional charts · classical interpretation.')}</div>

        <div style={S.card}>
          <div style={S.title}>
            {mode === 'login' ? t('Sign In') : step === 1 ? t('Create Account') : t('Who are you?')}
          </div>

          {error && <div style={S.err}>{error}</div>}

          {mode === 'login' && (
            <>
              {googleBtn}
              <input style={S.input} placeholder={t('Email')} type="email" value={email} onChange={e => setEmail(e.target.value)} />
              <input style={S.input} placeholder={t('Password')} type="password" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doLogin()} />
              <button style={S.btn} onClick={doLogin} disabled={loading}>
                {loading ? t('Please wait') : t('Sign In')}
              </button>
              <div style={S.toggle} onClick={() => { setMode('register'); setStep(1); setError('') }}>{t('No account')}</div>
            </>
          )}

          {mode === 'register' && step === 1 && (
            <>
              {googleBtn}
              <input style={S.input} placeholder={t('Full Name')} value={name} onChange={e => setName(e.target.value)} />
              <input style={S.input} placeholder={t('Email')} type="email" value={email} onChange={e => setEmail(e.target.value)} />
              <input style={S.input} placeholder={t('Phone')} type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
              <input style={S.input} placeholder={t('Password')} type="password" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && goStep2()} />
              <button style={S.btn} onClick={goStep2} disabled={loading}>{t('Continue')}</button>
              <div style={S.toggle} onClick={() => { setMode('login'); setError('') }}>{t('Have account')}</div>
            </>
          )}

          {mode === 'register' && step === 2 && (
            <>
              <div style={S.roleGrid}>
                <div style={{ ...S.roleCard, ...(role === 'astrologer' ? S.roleActive : {}) }} onClick={() => setRole('astrologer')}>
                  <div style={S.roleIcon}>🔮</div>
                  <div style={S.roleTitle}>{t('Professional astrologer')}</div>
                  <div style={S.roleSub}>{t('Manage clients, recommend gems, run my practice')}</div>
                </div>
                <div style={{ ...S.roleCard, ...(role === 'user' ? S.roleActive : {}) }} onClick={() => setRole('user')}>
                  <div style={S.roleIcon}>🌙</div>
                  <div style={S.roleTitle}>{t('Exploring my own chart')}</div>
                  <div style={S.roleSub}>{t('Read my kundli, dashas, matching & remedies')}</div>
                </div>
              </div>
              <button style={S.btn} onClick={doRegister} disabled={loading}>
                {loading ? t('Please wait') : t('Create Account')}
              </button>
              <div style={S.toggle} onClick={() => setStep(1)}>{t('Back')}</div>
            </>
          )}

          <div style={S.skip} onClick={onClose}>{t('Continue as guest')}</div>
        </div>
      </div>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  wrap: { minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', overflow: 'auto', padding: '32px 20px' },
  center: { width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column' },
  brand: { display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '14px' },
  logoBox: { width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(135deg,#5746AF,#8B5CF6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' },
  wordmark: { fontWeight: 800, fontSize: '22px', letterSpacing: '-0.02em', color: 'var(--text)' },
  shloka: { fontFamily: "'Noto Sans Devanagari', serif", fontSize: '15px', color: 'var(--accent)', lineHeight: 1.6, marginBottom: '4px' },
  tagline: { fontSize: '13px', color: 'var(--text3)', lineHeight: 1.6, marginBottom: '26px' },
  card: { width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '28px', boxShadow: '0 8px 30px -18px rgba(0,0,0,0.25)' },
  title: { fontSize: '19px', fontWeight: 800, marginBottom: '18px', color: 'var(--text)' },
  input: { width: '100%', padding: '11px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px', boxSizing: 'border-box', marginBottom: '11px' },
  btn: { width: '100%', padding: '11px', background: 'var(--accent)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 700, fontSize: '14.5px', cursor: 'pointer', marginTop: '4px' },
  googleBtn: { width: '100%', padding: '10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  gIcon: { fontWeight: 800, fontSize: '15px', color: '#4285F4', fontFamily: 'Arial, sans-serif' },
  divider: { display: 'flex', alignItems: 'center', gap: '10px', margin: '14px 0' },
  divLine: { flex: 1, height: '1px', background: 'var(--border)' },
  divText: { fontSize: '11.5px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  err: { color: 'var(--red)', fontSize: '13px', marginBottom: '12px', padding: '8px 10px', background: 'var(--red-bg)', borderRadius: '6px' },
  toggle: { color: 'var(--accent)', fontSize: '13px', textAlign: 'center', marginTop: '15px', cursor: 'pointer' },
  skip: { color: 'var(--text3)', fontSize: '12.5px', textAlign: 'center', marginTop: '18px', cursor: 'pointer', textDecoration: 'underline' },
  roleGrid: { display: 'flex', flexDirection: 'column', gap: '11px', marginBottom: '8px' },
  roleCard: { border: '2px solid var(--border)', borderRadius: '11px', padding: '15px', cursor: 'pointer', transition: 'all .15s', background: 'var(--bg)' },
  roleActive: { borderColor: 'var(--accent)', background: 'var(--accent-bg)' },
  roleIcon: { fontSize: '24px', marginBottom: '5px' },
  roleTitle: { fontWeight: 700, fontSize: '14.5px', color: 'var(--text)' },
  roleSub: { fontSize: '12px', color: 'var(--text3)', marginTop: '2px', lineHeight: 1.4 },
}
