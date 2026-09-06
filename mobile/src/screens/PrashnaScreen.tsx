import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../store/theme';
import { Colors, radius, spacing } from '../theme/theme';
import { type } from '../theme/typography';
import { prashnaChart } from '../api/astro';
import { apiError } from '../api/client';
import NorthIndianChart from '../components/NorthIndianChart';

const CATS = ['general','career','marriage','finance','health','travel','education','property','child','litigation'];

export default function PrashnaScreen({ navigation }: any) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => makeStyles(c), [c]);
  const [cat, setCat] = useState('general');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<any>(null);

  const ask = async () => {
    setError(''); setLoading(true); setData(null);
    try {
      // Uses the real moment of asking (Praśna Mārga time-chart).
      const r = await prashnaChart({ latitude: 28.613, longitude: 77.209, tz_offset: 5.5, question_category: cat, question_text: q.trim() });
      setData(r);
    } catch (e) { setError(apiError(e)); } finally { setLoading(false); }
  };

  const vibe = data?.vibe_score;
  const verdict = data?.verdict;

  return (
    <View style={{ flex: 1, backgroundColor: c.bgBody }}>
      <View style={[s.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} style={s.iconBtn}><Ionicons name="chevron-back" size={22} color={c.textPrimary} /></Pressable>
        <View><Text style={[type.screenTitle, { color: c.textPrimary }]}>Prashna</Text><Text style={[type.caption, { color: c.textMuted }]}>Horary · cast for this moment</Text></View>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        <Text style={[type.micro, { color: c.textMuted, marginBottom: spacing.sm }]}>QUESTION ABOUT</Text>
        <View style={s.chips}>
          {CATS.map((k) => (
            <Pressable key={k} onPress={() => setCat(k)} style={[s.chip, cat === k && s.chipOn]}>
              <Text style={[type.caption, { color: cat === k ? c.onAccent : c.textSecondary, textTransform: 'capitalize' }]}>{k}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput value={q} onChangeText={setQ} placeholder="Your question (optional)" placeholderTextColor={c.textMuted} style={s.input} multiline />
        <Pressable onPress={ask} disabled={loading} style={[s.cta, loading && { opacity: 0.7 }]}>
          {loading ? <ActivityIndicator color="#fff" /> : <><Ionicons name="sparkles" size={16} color="#fff" /><Text style={[type.button, { color: '#fff', marginLeft: 8 }]}>Cast Prashna</Text></>}
        </Pressable>
        {error ? <Text style={[type.body, { color: c.accentRed, marginTop: spacing.md }]}>{error}</Text> : null}

        {data && (
          <>
            {vibe && (
              <View style={[s.verdictCard, { marginTop: spacing.lg }]}>
                <Text style={[type.hero, { color: c.accentPrimary, fontFamily: undefined, fontSize: 40 }]}>{vibe.score}<Text style={[type.sectionTitle, { color: c.textMuted }]}>/100</Text></Text>
                <Text style={[type.sectionTitle, { color: c.textPrimary }]}>{verdict?.verdict || vibe.label}</Text>
              </View>
            )}
            {verdict?.signals?.length ? (
              <View style={s.card}>
                <Text style={[type.micro, { color: c.textMuted, marginBottom: spacing.sm }]}>SIGNALS</Text>
                {verdict.signals.map((sig: any, i: number) => (
                  <View key={i} style={s.sig}>
                    <Ionicons name={sig.positive ? 'checkmark-circle' : 'close-circle'} size={16} color={sig.positive ? c.accentGreen : c.accentRed} />
                    <Text style={[type.body, { color: c.textSecondary, flex: 1, marginLeft: 8 }]}>{sig.text}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            {data.ascendant && data.planet_house_map && (
              <View style={s.card}>
                <Text style={[type.micro, { color: c.textMuted, marginBottom: spacing.sm }]}>PRAŚNA KUNDLI · {data.ascendant.sign} Lagna</Text>
                <View style={{ alignItems: 'center' }}>
                  <NorthIndianChart size={300} ascSignIndex={data.ascendant.sign_index} planetHouseMap={data.planet_house_map} planets={data.planets} />
                </View>
              </View>
            )}
            {data.ruling_planets?.length ? (
              <View style={s.card}>
                <Text style={[type.micro, { color: c.textMuted, marginBottom: spacing.sm }]}>KP RULING PLANETS</Text>
                <Text style={[type.body, { color: c.textPrimary }]}>{(data.ruling_planets || []).map((r: any) => r.planet || r).join(' · ')}</Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: Colors) => StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.sm, paddingBottom: spacing.sm },
  iconBtn: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1, borderColor: c.borderCard, backgroundColor: c.bgCard },
  chipOn: { backgroundColor: c.accentPrimary, borderColor: c.accentPrimary },
  input: { minHeight: 60, borderWidth: 1, borderColor: c.inputBorder, backgroundColor: c.inputBg, borderRadius: radius.md, padding: 12, color: c.textPrimary, fontFamily: type.input.fontFamily, fontSize: 15, marginTop: spacing.md, textAlignVertical: 'top' },
  cta: { flexDirection: 'row', height: 52, borderRadius: radius.lg, backgroundColor: c.accentPrimary, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  verdictCard: { backgroundColor: c.bgCard, borderColor: c.borderCard, borderWidth: 1, borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.md },
  card: { backgroundColor: c.bgCard, borderColor: c.borderCard, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.md },
  sig: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
});
