import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useT } from '../i18n';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../store/theme';
import { Colors, radius, spacing } from '../theme/theme';
import { type } from '../theme/typography';
import { api, apiError } from '../api/client';
import { searchPlaces, Place } from '../api/astro';
import GenericResult from '../components/GenericResult';

const now = new Date();

export default function PanchangaScreen({ navigation }: any) {
  const c = useColors();
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => makeStyles(c), [c]);
  const [day, setDay] = useState(String(now.getDate()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
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
    try {
      const r = await api.post('/api/calc/panchanga', {
        year: parseInt(year, 10), month: parseInt(month, 10), day: parseInt(day, 10),
        hour: 6, minute: 0, tz_offset: 5.5, latitude: lat ?? 28.61, longitude: lon ?? 77.21, ayanamsa: 'lahiri',
      });
      setData(r.data);
    } catch (e) { setError(apiError(e)); } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.bgBody }}>
      <View style={[s.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} style={s.iconBtn}><Ionicons name="chevron-back" size={22} color={c.textPrimary} /></Pressable>
        <Text style={[type.screenTitle, { color: c.textPrimary }]}>{t('Panchāng')}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        <Text style={[type.eyebrow, { color: c.textSecondary, marginBottom: 6 }]}>{t('DATE')}</Text>
        <View style={s.row}>
          <TextInput value={day} onChangeText={setDay} keyboardType="number-pad" maxLength={2} placeholder="DD" placeholderTextColor={c.textMuted} style={[s.input, { flex: 1, marginBottom: 0 }]} />
          <TextInput value={month} onChangeText={setMonth} keyboardType="number-pad" maxLength={2} placeholder="MM" placeholderTextColor={c.textMuted} style={[s.input, { flex: 1, marginBottom: 0 }]} />
          <TextInput value={year} onChangeText={setYear} keyboardType="number-pad" maxLength={4} placeholder="YYYY" placeholderTextColor={c.textMuted} style={[s.input, { flex: 1.4, marginBottom: 0 }]} />
        </View>
        <Text style={[type.eyebrow, { color: c.textSecondary, margin: 0, marginTop: spacing.md, marginBottom: 6 }]}>{t('PLACE')}</Text>
        <TextInput value={place} onChangeText={onPlace} placeholder="Search city (default Delhi)" placeholderTextColor={c.textMuted} style={s.input} />
        {results.length > 0 && <View style={s.drop}>{results.map((p, i) => <Pressable key={i} onPress={() => pick(p)} style={s.dropItem}><Ionicons name="location-outline" size={14} color={c.accentPrimary} /><Text style={[type.caption, { color: c.textPrimary, marginLeft: 6, flex: 1 }]} numberOfLines={1}>{p.display}</Text></Pressable>)}</View>}
        <Pressable onPress={run} disabled={loading} style={[s.cta, loading && { opacity: 0.7 }]}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={[type.button, { color: '#fff' }]}>{t('Show Panchāng')}</Text>}
        </Pressable>
        {error ? <Text style={[type.body, { color: c.accentRed, marginTop: spacing.md }]}>{error}</Text> : null}
        {data ? <View style={s.card}><GenericResult data={data} /></View> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c: Colors) => StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.sm, paddingBottom: spacing.sm },
  iconBtn: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  input: { height: 46, borderWidth: 1, borderColor: c.inputBorder, backgroundColor: c.inputBg, borderRadius: radius.md, paddingHorizontal: 13, color: c.textPrimary, fontFamily: type.input.fontFamily, fontSize: 15, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  drop: { backgroundColor: c.bgElevated, borderWidth: 1, borderColor: c.borderCard, borderRadius: radius.md, overflow: 'hidden', marginBottom: spacing.sm },
  dropItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.borderCard },
  cta: { height: 52, borderRadius: radius.lg, backgroundColor: c.accentPrimary, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  card: { backgroundColor: c.bgCard, borderColor: c.borderCard, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.lg },
});
