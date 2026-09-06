import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useThemeStore } from '../store/theme';
import { useAuth } from '../store/auth';
import { Colors, radius, spacing } from '../theme/theme';
import { type } from '../theme/typography';

export default function ProfileScreen({ navigation }: any) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => makeStyles(c), [c]);
  const { user, logout } = useAuth();
  const { name: theme, toggle } = useThemeStore();

  return (
    <ScrollView style={{ backgroundColor: c.bgBody }} contentContainerStyle={{ paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + 32, paddingHorizontal: spacing.lg }}>
      <Text style={[type.screenTitle, { color: c.textPrimary, marginBottom: spacing.lg }]}>Profile</Text>

      {user ? (
        <View style={s.card}>
          <View style={s.avatar}><Text style={[type.sectionTitle, { color: c.onAccent }]}>{user.name[0]?.toUpperCase()}</Text></View>
          <Text style={[type.cardTitle, { color: c.textPrimary, marginTop: 10 }]}>{user.name}</Text>
          <Text style={[type.caption, { color: c.textMuted }]}>{user.email}</Text>
          <View style={s.planPill}><Text style={[type.micro, { color: c.accentPrimary }]}>{user.plan?.toUpperCase()} · {user.role}</Text></View>
        </View>
      ) : (
        <Pressable style={s.card} onPress={() => navigation.navigate('Auth')}>
          <Ionicons name="person-circle-outline" size={44} color={c.textMuted} />
          <Text style={[type.cardTitle, { color: c.textPrimary, marginTop: 8 }]}>Sign in to Grahika</Text>
          <Text style={[type.caption, { color: c.textMuted, marginTop: 2 }]}>Save & sync charts across devices</Text>
          <View style={[s.planPill, { backgroundColor: c.accentPrimary }]}><Text style={[type.micro, { color: c.onAccent }]}>LOG IN / CREATE ACCOUNT</Text></View>
        </Pressable>
      )}

      <Row s={s} c={c} icon={theme === 'dark' ? 'moon' : 'sunny'} label={`Theme: ${theme}`} onPress={toggle} right="Toggle" />

      {user ? (
        <Row s={s} c={c} icon="log-out-outline" label="Sign out" onPress={logout} danger />
      ) : null}

      <Text style={[type.caption, { color: c.textMuted, textAlign: 'center', marginTop: spacing.xl }]}>Grahika · ग्रहिका</Text>
    </ScrollView>
  );
}

function Row({ s, c, icon, label, onPress, right, danger }: any) {
  return (
    <Pressable style={s.row} onPress={onPress}>
      <Ionicons name={icon} size={20} color={danger ? c.accentRed : c.textSecondary} />
      <Text style={[type.bodyMed, { color: danger ? c.accentRed : c.textPrimary, flex: 1, marginLeft: 12 }]}>{label}</Text>
      {right ? <Text style={[type.caption, { color: c.textMuted }]}>{right}</Text> : <Ionicons name="chevron-forward" size={16} color={c.textMuted} />}
    </Pressable>
  );
}

const makeStyles = (c: Colors) => StyleSheet.create({
  card: { backgroundColor: c.bgCard, borderColor: c.borderCard, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', marginBottom: spacing.lg },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: c.accentPrimary, alignItems: 'center', justifyContent: 'center' },
  planPill: { backgroundColor: c.pillActiveBg, borderRadius: radius.pill, paddingVertical: 5, paddingHorizontal: 12, marginTop: 10 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.bgCard, borderColor: c.borderCard, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
});
