import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../store/theme';
import { type } from '../theme/typography';
import { spacing } from '../theme/theme';

// Placeholder for tools whose native screen is next in the migration queue.
export default function ComingSoonScreen({ route, navigation }: any) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const title = route.params?.title || route.name;
  return (
    <View style={{ flex: 1, backgroundColor: c.bgBody, paddingTop: insets.top }}>
      <Pressable onPress={() => navigation.goBack()} style={{ padding: spacing.md, alignSelf: 'flex-start' }}>
        <Ionicons name="chevron-back" size={24} color={c.textPrimary} />
      </Pressable>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Ionicons name="construct-outline" size={44} color={c.accentPrimary} />
        <Text style={[type.sectionTitle, { color: c.textPrimary, marginTop: 14 }]}>{title}</Text>
        <Text style={[type.body, { color: c.textMuted, marginTop: 6, textAlign: 'center' }]}>
          Native screen in progress. The calculation already runs on the backend — the native UI is next in the migration queue.
        </Text>
      </View>
    </View>
  );
}
