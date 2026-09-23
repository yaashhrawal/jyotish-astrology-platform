// Thin wrapper around the self-hosted Umami tracker (loaded in index.html).
// Safe no-op if the script is blocked or not yet loaded.
declare global {
  interface Window {
    umami?: { track: (event: string, data?: Record<string, unknown>) => void }
  }
}

export function track(event: string, data?: Record<string, unknown>) {
  try {
    window.umami?.track(event, data)
  } catch {
    /* analytics must never break the app */
  }
}
