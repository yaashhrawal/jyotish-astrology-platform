import React, { useMemo, useState, useRef } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useT } from '../i18n';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../store/theme';
import { Colors, radius, spacing } from '../theme/theme';
import { type } from '../theme/typography';
import PersonInput, { PersonValue } from '../components/PersonInput';
import { matchCompatibility, CompatResult } from '../api/astro';
import { apiError } from '../api/client';

export default function MatchScreen({ navigation }: any) {
  const c = useColors();
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => makeStyles(c), [c]);
  const p1 = useRef<PersonValue | null>(null);
  const p2 = useRef<PersonValue | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<CompatResult | null>(null);

  const run = async () => {
    setError('');
    const a = p1.current, b = p2.current;
    if (!a?.valid || !b?.valid) return setError('Pick a birth place for both people.');
    setLoading(true);
    try {
      const r = await matchCompatibility({
        p1_name: a.name, p1_year: a.year, p1_month: a.month, p1_day: a.day, p1_hour: a.hour, p1_minute: a.minute, p1_tz_offset: a.tz_offset, p1_lat: a.lat!, p1_lon: a.lon!,
        p2_name: b.name, p2_year: b.year, p2_month: b.month, p2_day: b.day, p2_hour: b.hour, p2_minute: b.minute, p2_tz_offset: b.tz_offset, p2_lat: b.lat!, p2_lon: b.lon!,
      });
      setResult(r);
    } catch (e) { setError(apiError(e)); } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.bgBody }}>
      <View style={[s.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} style={s.iconBtn}><Ionicons name="chevron-back" size={22} color={c.textPrimary} /></Pressable>
        <Text style={[type.screenTitle, { color: c.textPrimary }]}>{t('Matchmaking')}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        {result ? (
          <>
            <View style={s.scoreCard}>
              <Text style={[type.hero, { color: c.accentPrimary, fontFamily: undefined, fontSize: 44 }]}>{result.score}<Text style={[type.sectionTitle, { color: c.textMuted }]}>/{result.max_score}</Text></Text>
              <Text style={[type.sectionTitle, { color: c.textPrimary, marginTop: 2 }]}>{result.verdict}</Text>
              <Text style={[type.body, { color: c.textMuted, marginTop: 2 }]}>{result.percentage}% · {result.person1.name} ✦ {result.person2.name}</Text>
            </View>
            <View style={s.card}>
              <Text style={[type.micro, { color: c.textMuted, marginBottom: spacing.sm }]}>{t('AṢṬAKOOTA BREAKDOWN')}</Text>
              {Object.entries(result.kootas).map(([k, v]) => {
                const pct = v.max ? v.score / v.max : 0;
                return (
                  <View key={k} style={{ marginBottom: 11 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={[type.bodyMed, { color: c.textPrimary }]}>{k}</Text>
                      <Text style={[type.caption, { color: c.textSecondary }]}>{v.score} / {v.max}</Text>
                    </View>
                    <View style={s.barBg}><View style={[s.barFill, { width: `${pct * 100}%`, backgroundColor: pct >= 0.5 ? c.accentGreen : c.accentPrimary }]} /></View>
                  </View>
                );
              })}
            </View>
            <Pressable onPress={() => setResult(null)} style={s.ghost}><Text style={[type.button, { color: c.accentPrimary }]}>{t('New match')}</Text></Pressable>
          </>
        ) : (
          <>
            <PersonInput label="Person 1" onChange={(v) => (p1.current = v)} />
            <PersonInput label="Person 2" onChange={(v) => (p2.current = v)} />
            {error ? <Text style={[type.body, { color: c.accentRed, marginBottom: spacing.sm }]}>{error}</Text> : null}
            <Pressable onPress={run} disabled={loading} style={[s.cta, loading && { opacity: 0.7 }]}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={[type.button, { color: '#fff' }]}>{t('Check Compatibility')}</Text>}
            </Pressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c: Colors) => StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.sm, paddingBottom: spacing.sm },
  iconBtn: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  scoreCard: { backgroundColor: c.bgCard, borderColor: c.borderCard, borderWidth: 1, borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.md },
  card: { backgroundColor: c.bgCard, borderColor: c.borderCard, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  cta: { height: 52, borderRadius: radius.lg, backgroundColor: c.accentPrimary, alignItems: 'center', justifyContent: 'center' },
  ghost: { height: 48, borderRadius: radius.lg, borderWidth: 1, borderColor: c.borderStrong, alignItems: 'center', justifyContent: 'center' },
  barBg: { height: 7, borderRadius: 4, backgroundColor: c.tagBg, marginTop: 5, overflow: 'hidden' },
  barFill: { height: 7, borderRadius: 4 },
});
