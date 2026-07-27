/**
 * Push notification setup for Capacitor.
 * Handles FCM (Android) and APNs (iOS) registration.
 * Notification tap routing: dasha alerts → Dasha tab, gem updates → Earnings tab, etc.
 */
import { Capacitor } from '@capacitor/core'

export async function initPushNotifications(
  onTabSwitch: (tab: string) => void
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return

  const { PushNotifications } = await import('@capacitor/push-notifications')

  // Request permission
  const perm = await PushNotifications.requestPermissions()
  if (perm.receive !== 'granted') return

  await PushNotifications.register()

  // Log FCM/APNs token — send to backend to associate with user
  PushNotifications.addListener('registration', token => {
    console.log('[Push] Device token:', token.value)
    // TODO: POST token to /api/push/register when backend endpoint added
  })

  PushNotifications.addListener('registrationError', err => {
    console.error('[Push] Registration error:', err)
  })

  // Route notification taps to correct tab
  PushNotifications.addListener('pushNotificationActionPerformed', action => {
    const data = action.notification.data as Record<string, string>
    const route = data?.route
    if (!route) return

    // route values sent from backend: 'dasha', 'earnings', 'gems', 'crm', etc.
    const tabMap: Record<string, string> = {
      dasha: 'dasha',
      earnings: 'earnings',
      gems: 'gems',
      crm: 'crm',
      predictions: 'predictions',
    }
    if (tabMap[route]) onTabSwitch(tabMap[route])
  })
}
