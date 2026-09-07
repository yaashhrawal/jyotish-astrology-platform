import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../store/theme';
import { Colors, radius, spacing } from '../theme/theme';
import { type } from '../theme/typography';
import { api, apiError } from '../api/client';
import { searchPlaces, Place } from '../api/astro';

const PURPOSES = ['general','marriage','travel','business','education','medical','construction'];
const now = new Date();
const plus = (days: number) => { const d = new Date(now.getTime() + days * 864e5); return d; };

export default function MuhurtaScreen({ navigation }: any) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => makeStyles(c), [c]);
  const [purpose, setPurpose] = useState('marriage');
  const [place, setPlace] = useState('');
  const [lat, setLat] = useState<number | null>(28.61);
  const [lon, setLon] = useState<number | null>(77.21);
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<any>(null);

  const onPlace = async (q: string) => { setPlace(q); setResults(q.trim().length >= 3 ? await searchPlaces(q) : []); };
  const pick = (p: Place) => { setPlace(p.display.split(',').slice(0, 2).join(',')); setLat(p.latitude); setLon(p.longitude); setResults([]); Keyboard.dismiss(); };

  const run = async () => {
    setError(''); setLoading(true); setData(null);
    const e = plus(7);
    try {
      const r = await api.post('/api/calc/muhurta', {
        lat: lat ?? 28.61, lon: lon ?? 77.21, tz: 5.5,
        start_year: now.getFullYear(), start_month: now.getMonth() + 1, start_day: now.getDate(),
        end_year: e.getFullYear(), end_month: e.getMonth() + 1, end_day: e.getDate(),
        purpose, ayanamsa: 'lahiri',
      });
      setData(r.data);
    } catch (er) { setError(apiError(er)); } finally { setLoading(false); }
  };

  const best = data?.best_muhurtas || [];

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.bgBody }}>
      <View style={[s.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} style={s.iconBtn}><Ionicons name="chevron-back" size={22} color={c.textPrimary} /></Pressable>
        <View><Text style={[type.screenTitle, { color: c.textPrimary }]}>Muhūrta</Text><Text style={[type.caption, { color: c.textMuted }]}>Best times · next 7 days</Text></View>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        <Text style={[type.eyebrow, { color: c.textSecondary, marginBottom: 6 }]}>PURPOSE</Text>
        <View style={s.chips}>
          {PURPOSES.map((p) => <Pressable key={p} onPress={() => setPurpose(p)} style={[s.chip, purpose === p && s.chipOn]}><Text style={[type.caption, { color: purpose === p ? c.onAccent : c.textSecondary, textTransform: 'capitalize' }]}>{p}</Text></Pressable>)}
        </View>
        <TextInput value={place} onChangeText={onPlace} placeholder="Place (default Delhi)" placeholderTextColor={c.textMuted} style={s.input} />
        {results.length > 0 && <View style={s.drop}>{results.map((p, i) => <Pressable key={i} onPress={() => pick(p)} style={s.dropItem}><Ionicons name="location-outline" size={14} color={c.accentPrimary} /><Text style={[type.caption, { color: c.textPrimary, marginLeft: 6, flex: 1 }]} numberOfLines={1}>{p.display}</Text></Pressable>)}</View>}
        <Pressable onPress={run} disabled={loading} style={[s.cta, loading && { opacity: 0.7 }]}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={[type.button, { color: '#fff' }]}>Find Muhūrtas</Text>}
        </Pressable>
        {error ? <Text style={[type.body, { color: c.accentRed, marginTop: spacing.md }]}>{error}</Text> : null}
        {data ? (
          best.length ? best.map((m: any, i: number) => (
            <View key={i} style={s.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[type.cardTitle, { color: c.textPrimary }]}>{m.datetime || `${m.date} ${m.time}`}</Text>
                {m.score != null ? <View style={s.pill}><Text style={[type.micro, { color: c.accentPrimary }]}>{typeof m.score === 'object' ? m.score.score : m.score}</Text></View> : null}
              </View>
              <Text style={[type.caption, { color: c.textMuted, marginTop: 4 }]}>
                {m.vara?.day} · {m.tithi?.name} ({m.tithi?.paksha}) · {m.nakshatra?.nakshatra || m.nakshatra}
              </Text>
            </View>
          )) : <Text style={[type.body, { color: c.textMuted, marginTop: spacing.lg }]}>No strong muhūrtas found in this window.</Text>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c: Colors) => StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.sm, paddingBottom: spacing.sm },
  iconBtn: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  chip: { paddingVertical: 8, paddingHorizontal: 13, borderRadius: radius.pill, borderWidth: 1, borderColor: c.borderCard, backgroundColor: c.bgCard },
  chipOn: { backgroundColor: c.accentPrimary, borderColor: c.accentPrimary },
  input: { height: 46, borderWidth: 1, borderColor: c.inputBorder, backgroundColor: c.inputBg, borderRadius: radius.md, paddingHorizontal: 13, color: c.textPrimary, fontFamily: type.input.fontFamily, fontSize: 15 },
  drop: { backgroundColor: c.bgElevated, borderWidth: 1, borderColor: c.borderCard, borderRadius: radius.md, overflow: 'hidden', marginTop: spacing.sm },
  dropItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.borderCard },
  cta: { height: 52, borderRadius: radius.lg, backgroundColor: c.accentPrimary, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  card: { backgroundColor: c.bgCard, borderColor: c.borderCard, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.md },
  pill: { backgroundColor: c.accentBg, borderRadius: radius.pill, paddingVertical: 3, paddingHorizontal: 10 },
});
