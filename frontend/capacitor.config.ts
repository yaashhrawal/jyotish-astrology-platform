import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.grahika.app',
  appName: 'Grahika',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Uncomment for dev testing against local backend on physical device:
    // url: 'http://YOUR_LOCAL_IP:8888',
    // cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      backgroundColor: '#1C1917',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1C1917',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  android: {
    buildOptions: {
      releaseType: 'APK',
    },
  },
  ios: {
    contentInset: 'automatic',
  },
}

export default config
