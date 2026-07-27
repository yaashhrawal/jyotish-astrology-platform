import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'
import { isOnline, onNetworkChange } from '../lib/network'
import { useLang } from '../contexts/LanguageContext'

export default function OfflineBanner() {
  const { t } = useLang()
  const [offline, setOffline] = useState(!isOnline())

  useEffect(() => onNetworkChange(online => setOffline(!online)), [])

  if (!offline) return null

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: '#1e1b4b', color: '#e9d5ff',
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 16px', fontSize: 13, fontWeight: 600,
    }}>
      <WifiOff size={15} />
      {t('Offline — showing cached charts. Calculations require internet.')}
    </div>
  )
}
