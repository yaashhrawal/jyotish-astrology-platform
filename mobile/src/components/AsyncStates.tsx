import React from 'react';
import { View, Text, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../store/theme';
import { type } from '../theme/typography';

export function Loading({ label }: { label?: string }) {
  const c = useColors();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={c.accentPrimary} size="large" />
      {label ? <Text style={[type.body, { color: c.textMuted, marginTop: 12 }]}>{label}</Text> : null}
    </View>
  );
}

export function EmptyState({ icon = 'sparkles-outline', title, subtitle }: { icon?: any; title: string; subtitle?: string }) {
  const c = useColors();
  return (
    <View style={styles.center}>
      <Ionicons name={icon} size={40} color={c.textMuted} />
      <Text style={[type.sectionTitle, { color: c.textPrimary, marginTop: 14 }]}>{title}</Text>
      {subtitle ? <Text style={[type.body, { color: c.textMuted, marginTop: 6, textAlign: 'center' }]}>{subtitle}</Text> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const c = useColors();
  return (
    <View style={styles.center}>
      <Ionicons name="alert-circle-outline" size={40} color={c.accentRed} />
      <Text style={[type.body, { color: c.textSecondary, marginTop: 12, textAlign: 'center', maxWidth: 260 }]}>{message}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} style={[styles.retry, { backgroundColor: c.accentBg, borderColor: c.accentPrimary }]}>
          <Ionicons name="refresh" size={15} color={c.accentPrimary} />
          <Text style={[type.button, { color: c.accentPrimary, marginLeft: 6 }]}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  retry: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, marginTop: 18 },
});
