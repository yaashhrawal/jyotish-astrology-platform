import { useEffect, useState } from 'react'
import { profileApi, type AstrologerProfile } from '../../api/client'
import { useLang } from '../../contexts/LanguageContext'
import toast from 'react-hot-toast'

const card: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
  padding: 18,
}
const label: React.CSSProperties = { fontSize: 11, color: 'var(--text3)', marginBottom: 4, fontWeight: 600 }
const input: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)',
  background: 'var(--surface2)', color: 'var(--text)', fontSize: 13,
}
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }

function Field({ name, value, onChange, placeholder, type = 'text' }: any) {
  return (
    <div>
      <div style={label}>{name}</div>
      <input style={input} type={type} value={value || ''} placeholder={placeholder}
             onChange={e => onChange(e.target.value)} />
    </div>
  )
}

function ImageUpload({ kind, currentUrl, onUploaded }: { kind: 'logo'|'photo'|'signature'; currentUrl?: string; onUploaded: (url: string) => void }) {
  const { t } = useLang()
  const [busy, setBusy] = useState(false)
  const handle = async (file: File) => {
    if (file.size > 1024 * 1024) { toast.error(t('Max 1 MB')); return }
    setBusy(true)
    try {
      const { url } = await profileApi.upload(kind, file)
      onUploaded(url)
      toast.success(`${kind} ${t('uploaded')}`)
    } catch (e: any) { toast.error(e?.response?.data?.detail || t('Upload failed')) }
    finally { setBusy(false) }
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 70, height: 70, border: '1px dashed var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface2)', overflow: 'hidden' }}>
        {currentUrl ? <img src={currentUrl} alt={kind} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                     : <span style={{ fontSize: 10, color: 'var(--text4)' }}>{t('No')} {kind}</span>}
      </div>
      <label style={{ cursor: 'pointer', padding: '6px 12px', background: 'var(--accent)', color: '#fff', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
        {busy ? t('Uploading…') : `${t('Upload')} ${kind}`}
        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handle(e.target.files[0])} />
      </label>
    </div>
  )
}

export default function AstrologerProfileSettings() {
  const { t } = useLang()
  const [p, setP] = useState<AstrologerProfile>({ primary_color: '#7C2D12', secondary_color: '#92400E', show_powered_by: true })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const set = (k: keyof AstrologerProfile) => (v: any) => setP({ ...p, [k]: v })

  useEffect(() => {
    profileApi.get().then(d => { if (d.exists) setP(d) }).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try { await profileApi.save(p); toast.success(t('Profile saved')) }
    catch (e: any) { toast.error(e?.response?.data?.detail || t('Save failed')) }
    finally { setSaving(false) }
  }

  if (loading) return <div style={{ padding: 20, color: 'var(--text3)' }}>{t('Loading profile…')}</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 900 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{t('Brand & PDF Letterhead')}</div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>{t('Used on every PDF report and receipt you generate.')}</div>
      </div>

      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>{t('Brand Assets')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <ImageUpload kind="logo" currentUrl={p.logo_url} onUploaded={v => setP({ ...p, logo_url: v })} />
          <ImageUpload kind="photo" currentUrl={p.photo_url} onUploaded={v => setP({ ...p, photo_url: v })} />
          <ImageUpload kind="signature" currentUrl={p.signature_url} onUploaded={v => setP({ ...p, signature_url: v })} />
        </div>
      </div>

      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>{t('Identity')}</div>
        <div style={grid2}>
          <Field name={t('Display Name')} value={p.display_name} onChange={set('display_name')} placeholder={t('Pt. Rakesh Sharma')} />
          <Field name={t('Title')} value={p.title} onChange={set('title')} placeholder={t('Jyotish Acharya · MA Vedic Astrology')} />
          <Field name={t('Registration No.')} value={p.registration_no} onChange={set('registration_no')} placeholder="KSAB-2018-1234" />
          <Field name={t('Tagline')} value={p.tagline} onChange={set('tagline')} placeholder={t('30 years of accurate predictions')} />
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={label}>{t('Qualifications (comma separated)')}</div>
          <input style={input} value={(p.qualifications || []).join(', ')}
                 onChange={e => set('qualifications')(e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={label}>{t('Bio')}</div>
          <textarea style={{ ...input, minHeight: 60 }} value={p.bio || ''} onChange={e => set('bio')(e.target.value)} />
        </div>
      </div>

      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>{t('Contact')}</div>
        <div style={grid2}>
          <Field name={t('Phone')} value={p.phone} onChange={set('phone')} />
          <Field name={t('WhatsApp')} value={p.whatsapp} onChange={set('whatsapp')} />
          <Field name={t('Email')} value={p.email} onChange={set('email')} type="email" />
          <Field name={t('Website')} value={p.website} onChange={set('website')} placeholder="https://" />
        </div>
      </div>

      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>{t('Address')}</div>
        <div style={grid2}>
          <Field name={t('Address Line 1')} value={p.address_line1} onChange={set('address_line1')} />
          <Field name={t('Address Line 2')} value={p.address_line2} onChange={set('address_line2')} />
          <Field name={t('City')} value={p.city} onChange={set('city')} />
          <Field name={t('State')} value={p.state} onChange={set('state')} />
          <Field name={t('Pincode')} value={p.pincode} onChange={set('pincode')} />
        </div>
      </div>

      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>{t('Tax & Compliance')}</div>
        <div style={grid2}>
          <Field name={t('GSTIN')} value={p.gst_number} onChange={set('gst_number')} placeholder="27AAACR1234F1Z5" />
          <Field name={t('PAN')} value={p.pan_number} onChange={set('pan_number')} placeholder="AAACR1234F" />
        </div>
      </div>

      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>{t('Branding')}</div>
        <div style={grid2}>
          <div>
            <div style={label}>{t('Primary Color')}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="color" value={p.primary_color || '#7C2D12'} onChange={e => set('primary_color')(e.target.value)} style={{ width: 50, height: 32, border: 'none', background: 'transparent' }} />
              <input style={input} value={p.primary_color || ''} onChange={e => set('primary_color')(e.target.value)} />
            </div>
          </div>
          <div>
            <div style={label}>{t('Secondary Color')}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="color" value={p.secondary_color || '#92400E'} onChange={e => set('secondary_color')(e.target.value)} style={{ width: 50, height: 32, border: 'none', background: 'transparent' }} />
              <input style={input} value={p.secondary_color || ''} onChange={e => set('secondary_color')(e.target.value)} />
            </div>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={label}>{t('PDF Footer Quote (Sanskrit shloka or motto)')}</div>
          <input style={input} value={p.pdf_footer_quote || ''} onChange={e => set('pdf_footer_quote')(e.target.value)} />
        </div>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={!!p.show_powered_by} onChange={e => set('show_powered_by')(e.target.checked)} />
          <span style={{ fontSize: 12 }}>{t('Show "Powered by Grahika" footer (Pro plan can hide)')}</span>
        </div>
      </div>

      <div>
        <button onClick={save} disabled={saving} style={{
          padding: '10px 24px', background: 'var(--accent)', color: '#fff', border: 'none',
          borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
        }}>{saving ? t('Saving…') : t('Save Profile')}</button>
      </div>
    </div>
  )
}
