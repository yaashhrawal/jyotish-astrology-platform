import React, { useMemo, useState, useRef } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useT } from '../i18n';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../store/theme';
import { Colors, radius, spacing } from '../theme/theme';
import { type } from '../theme/typography';
import PersonInput, { PersonValue } from '../components/PersonInput';
import { synastry } from '../api/astro';
import { apiError } from '../api/client';

export default function CompareScreen({ navigation }: any) {
  const c = useColors();
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => makeStyles(c), [c]);
  const p1 = useRef<PersonValue | null>(null);
  const p2 = useRef<PersonValue | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [res, setRes] = useState<any>(null);

  const run = async () => {
    setError('');
    const a = p1.current, b = p2.current;
    if (!a?.valid || !b?.valid) return setError('Pick a birth place for both people.');
    setLoading(true);
    try {
      const r = await synastry({
        p1_name: a.name, p1_year: a.year, p1_month: a.month, p1_day: a.day, p1_hour: a.hour, p1_minute: a.minute, p1_tz_offset: a.tz_offset, p1_lat: a.lat!, p1_lon: a.lon!,
        p2_name: b.name, p2_year: b.year, p2_month: b.month, p2_day: b.day, p2_hour: b.hour, p2_minute: b.minute, p2_tz_offset: b.tz_offset, p2_lat: b.lat!, p2_lon: b.lon!,
      });
      setRes(r);
    } catch (e) { setError(apiError(e)); } finally { setLoading(false); }
  };

  const NAT: Record<string, string> = { harmonious: c.accentGreen, challenging: c.accentRed, neutral: c.textMuted };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.bgBody }}>
      <View style={[s.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} style={s.iconBtn}><Ionicons name="chevron-back" size={22} color={c.textPrimary} /></Pressable>
        <View><Text style={[type.screenTitle, { color: c.textPrimary }]}>{t('Compare')}</Text><Text style={[type.caption, { color: c.textMuted }]}>Synastry · chart-to-chart</Text></View>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        {res ? (
          <>
            {res.summary ? (
              <View style={s.sumCard}>
                <Text style={[type.sectionTitle, { color: c.textPrimary }]}>{res.p1?.name} ✦ {res.p2?.name}</Text>
                {typeof res.summary === 'object'
                  ? Object.entries(res.summary).map(([k, v]: any) => <Text key={k} style={[type.body, { color: c.textSecondary, marginTop: 4 }]}>{k}: {String(v)}</Text>)
                  : <Text style={[type.body, { color: c.textSecondary, marginTop: 4 }]}>{String(res.summary)}</Text>}
              </View>
            ) : null}
            <View style={s.card}>
              <Text style={[type.micro, { color: c.textMuted, marginBottom: spacing.sm }]}>{t('INTER-CHART ASPECTS')}</Text>
              {(res.aspects || []).slice(0, 30).map((a: any, i: number) => (
                <View key={i} style={s.aRow}>
                  <Text style={[type.bodyMed, { color: c.textPrimary, flex: 1 }]}>{a.p1_planet || a.from} {a.aspect} {a.p2_planet || a.to}</Text>
                  <Text style={[type.caption, { color: NAT[a.nature] || c.textMuted, textTransform: 'capitalize' }]}>{a.nature}{a.orb != null ? ` ${a.orb}°` : ''}</Text>
                </View>
              ))}
              {!(res.aspects || []).length ? <Text style={[type.body, { color: c.textMuted }]}>No tight aspects.</Text> : null}
            </View>
            <Pressable onPress={() => setRes(null)} style={s.ghost}><Text style={[type.button, { color: c.accentPrimary }]}>{t('New comparison')}</Text></Pressable>
          </>
        ) : (
          <>
            <PersonInput label="Person 1" onChange={(v) => (p1.current = v)} />
            <PersonInput label="Person 2" onChange={(v) => (p2.current = v)} />
            {error ? <Text style={[type.body, { color: c.accentRed, marginBottom: spacing.sm }]}>{error}</Text> : null}
            <Pressable onPress={run} disabled={loading} style={[s.cta, loading && { opacity: 0.7 }]}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={[type.button, { color: '#fff' }]}>{t('Compare Charts')}</Text>}
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
  sumCard: { backgroundColor: c.bgCard, borderColor: c.borderCard, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  card: { backgroundColor: c.bgCard, borderColor: c.borderCard, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  aRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 8 },
  cta: { height: 52, borderRadius: radius.lg, backgroundColor: c.accentPrimary, alignItems: 'center', justifyContent: 'center' },
  ghost: { height: 48, borderRadius: radius.lg, borderWidth: 1, borderColor: c.borderStrong, alignItems: 'center', justifyContent: 'center' },
});
