import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.jyotish.app',
  appName: 'Jyotish',
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
      backgroundColor: '#4c1d95',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#4c1d95',
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
