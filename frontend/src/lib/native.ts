// Native (Capacitor) runtime setup — no-ops on web.
import { Capacitor } from '@capacitor/core'

export function isNative() {
  return Capacitor.isNativePlatform()
}

export async function initNative() {
  if (!Capacitor.isNativePlatform()) return
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    // Push webview below the status bar so the header isn't overlapped (Android).
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setOverlaysWebView({ overlay: false })
    }
    await StatusBar.setStyle({ style: Style.Dark })
  } catch { /* plugin missing in some builds — ignore */ }

  try {
    const { SplashScreen } = await import('@capacitor/splash-screen')
    await SplashScreen.hide()
  } catch { /* ignore */ }
}
