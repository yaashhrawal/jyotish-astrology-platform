import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import OfflineBanner from './components/OfflineBanner.tsx'
import { LanguageProvider } from './contexts/LanguageContext.tsx'
import { initNetwork } from './lib/network.ts'

// Boot network detection (Capacitor native or browser)
initNetwork()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
      <OfflineBanner />
    </LanguageProvider>
  </StrictMode>,
)
