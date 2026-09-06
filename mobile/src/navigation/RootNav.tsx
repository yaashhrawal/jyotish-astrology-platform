import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../store/theme';
import { type } from '../theme/typography';

import HomeScreen from '../screens/HomeScreen';
import SavedScreen from '../screens/SavedScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CreateChartScreen from '../screens/CreateChartScreen';
import ChartScreen from '../screens/ChartScreen';
import AuthScreen from '../screens/AuthScreen';
import MatchScreen from '../screens/MatchScreen';
import PrashnaScreen from '../screens/PrashnaScreen';
import CompareScreen from '../screens/CompareScreen';
import GemsScreen from '../screens/GemsScreen';
import ComingSoonScreen from '../screens/ComingSoonScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const ICONS: Record<string, any> = { Home: 'home', Saved: 'bookmark', Profile: 'person' };

function Tabs() {
  const c = useColors();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: c.accentPrimary,
        tabBarInactiveTintColor: c.textMuted,
        tabBarStyle: { backgroundColor: c.navBg, borderTopColor: c.borderCard, borderTopWidth: 0.5 },
        tabBarLabelStyle: { fontFamily: type.micro.fontFamily, fontSize: 10 },
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons name={(focused ? ICONS[route.name] : `${ICONS[route.name]}-outline`) as any} size={size - 2} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Saved" component={SavedScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function RootNav() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen name="CreateChart" component={CreateChartScreen} />
      <Stack.Screen name="Chart" component={ChartScreen} />
      <Stack.Screen name="Auth" component={AuthScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Match" component={MatchScreen} />
      <Stack.Screen name="Compare" component={CompareScreen} />
      <Stack.Screen name="Prashna" component={PrashnaScreen} />
      <Stack.Screen name="Gems" component={GemsScreen} />
    </Stack.Navigator>
  );
}
