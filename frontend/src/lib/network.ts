/**
 * Network status detection.
 * Uses Capacitor Network plugin on native, navigator.onLine on web.
 */
import { Capacitor } from '@capacitor/core'

type NetworkListener = (online: boolean) => void
const listeners: NetworkListener[] = []
let _isOnline = true

export function isOnline(): boolean {
  return _isOnline
}

export function onNetworkChange(fn: NetworkListener): () => void {
  listeners.push(fn)
  return () => { const i = listeners.indexOf(fn); if (i > -1) listeners.splice(i, 1) }
}

function notify(online: boolean) {
  if (online === _isOnline) return
  _isOnline = online
  listeners.forEach(fn => fn(online))
}

export async function initNetwork(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const { Network } = await import('@capacitor/network')
    const status = await Network.getStatus()
    _isOnline = status.connected
    Network.addListener('networkStatusChange', s => notify(s.connected))
  } else {
    _isOnline = navigator.onLine
    window.addEventListener('online', () => notify(true))
    window.addEventListener('offline', () => notify(false))
  }
}

/**
 * Opens a URL in the system browser (Razorpay, portals, gem purchases).
 * Uses Capacitor Browser on native so the app stays open in background.
 */
export async function openExternalUrl(url: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const { Browser } = await import('@capacitor/browser')
    await Browser.open({ url, presentationStyle: 'popover' })
  } else {
    window.open(url, '_blank', 'noopener')
  }
}
