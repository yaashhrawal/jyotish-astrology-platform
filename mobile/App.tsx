import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { EBGaramond_600SemiBold, EBGaramond_700Bold } from '@expo-google-fonts/eb-garamond';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';

import RootNav from './src/navigation/RootNav';
import { useColors, useThemeStore } from './src/store/theme';
import { useAuth } from './src/store/auth';
import { useLangStore } from './src/i18n';

function Root() {
  const c = useColors();
  const theme = useThemeStore((s) => s.name);
  const init = useAuth((s) => s.init);
  const initLang = useLangStore((s) => s.init);

  useEffect(() => { init(); initLang(); }, [init, initLang]);

  const navTheme = {
    ...(theme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme === 'dark' ? DarkTheme : DefaultTheme).colors,
      background: c.bgBody,
      card: c.navBg,
      text: c.textPrimary,
      primary: c.accentPrimary,
      border: c.borderCard,
    },
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bgBody }}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <NavigationContainer theme={navTheme}>
        <RootNav />
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  const [loaded] = useFonts({
    EBGaramond_600SemiBold, EBGaramond_700Bold,
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  });
  if (!loaded) return null; // native splash stays up
  return (
    <SafeAreaProvider>
      <Root />
    </SafeAreaProvider>
  );
}
