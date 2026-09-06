import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../store/theme';
import { useAuth } from '../store/auth';
import { Colors, radius, spacing } from '../theme/theme';
import { type } from '../theme/typography';
import { ChartResponse, BirthData, getVarga, VargaResponse, saveChart } from '../api/astro';
import { apiError } from '../api/client';
import NorthIndianChart from '../components/NorthIndianChart';

const ORDER = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const VARGAS = [
  { d: 2, n: 'D2 Horā' }, { d: 3, n: 'D3 Drekkāṇa' }, { d: 7, n: 'D7 Saptāṁśa' },
  { d: 9, n: 'D9 Navāṁśa' }, { d: 10, n: 'D10 Daśāṁśa' }, { d: 12, n: 'D12 Dvādaśāṁśa' },
  { d: 16, n: 'D16' }, { d: 20, n: 'D20' }, { d: 24, n: 'D24' }, { d: 27, n: 'D27' },
  { d: 30, n: 'D30 Triṁśāṁśa' }, { d: 60, n: 'D60 Ṣaṣṭyāṁśa' },
];
type Section = 'chart' | 'vargas' | 'dasha';

export default function ChartScreen({ route, navigation }: any) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => makeStyles(c), [c]);
  const chart: ChartResponse = route.params?.chart;
  const birth: BirthData | undefined = route.params?.birth;
  const user = useAuth((st) => st.user);

  const [section, setSection] = useState<Section>('chart');
  const [vNum, setVNum] = useState(9);
  const [vData, setVData] = useState<Record<number, VargaResponse>>({});
  const [vLoading, setVLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadVarga = useCallback(async (num: number) => {
    setVNum(num);
    if (vData[num] || !birth) return;
    setVLoading(true);
    try { const r = await getVarga(birth, num); setVData((p) => ({ ...p, [num]: r })); }
    catch (e) { Alert.alert('Could not load chart', apiError(e)); }
    finally { setVLoading(false); }
  }, [birth, vData]);

  const onSave = async () => {
    if (!birth) return;
    if (!user) {
      Alert.alert(
        'Create an account to save',
        'Save this kundli and sync it across your devices — free account.',
        [{ text: 'Not now', style: 'cancel' }, { text: 'Create account', onPress: () => navigation.navigate('Auth') }]
      );
      return;
    }
    setSaving(true);
    try {
      await saveChart({
        name: birth.name, birth_date: `${birth.year}-${String(birth.month).padStart(2,'0')}-${String(birth.day).padStart(2,'0')}`,
        birth_time: `${String(birth.hour).padStart(2,'0')}:${String(birth.minute).padStart(2,'0')}`,
        birth_tz: birth.tz_offset, birth_place: birth.place, latitude: birth.latitude, longitude: birth.longitude,
        ayanamsa: birth.ayanamsa, chart_data: chart,
      });
      Alert.alert('Saved', 'Kundli saved to your account.');
    } catch (e) { Alert.alert('Save failed', apiError(e)); }
    finally { setSaving(false); }
  };

  if (!chart) return <View style={s.center}><Text style={[type.body, { color: c.textMuted }]}>No chart.</Text></View>;

  const cur = vData[vNum];

  return (
    <View style={{ flex: 1, backgroundColor: c.bgBody }}>
      <View style={[s.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} style={s.iconBtn}><Ionicons name="chevron-back" size={22} color={c.textPrimary} /></Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[type.sectionTitle, { color: c.textPrimary }]} numberOfLines={1}>{chart.name}</Text>
          <Text style={[type.caption, { color: c.textMuted }]} numberOfLines={1}>{chart.birth} · {chart.place}</Text>
        </View>
        <Pressable onPress={onSave} style={s.iconBtn}>
          {saving ? <ActivityIndicator color={c.accentPrimary} /> : <Ionicons name="bookmark-outline" size={20} color={c.accentPrimary} />}
        </Pressable>
      </View>

      {/* section switcher */}
      <View style={s.seg}>
        {(['chart','vargas','dasha'] as Section[]).map((sec) => (
          <Pressable key={sec} onPress={() => { setSection(sec); if (sec === 'vargas') loadVarga(vNum); }} style={[s.segItem, section === sec && s.segItemOn]}>
            <Text style={[type.bodyMed, { color: section === sec ? c.onAccent : c.textSecondary }]}>
              {sec === 'chart' ? 'Chart' : sec === 'vargas' ? 'Vargas' : 'Dāśā'}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
        {section === 'chart' && (
          <>
            <View style={s.pillRow}>
              <View style={s.pill}><Text style={[type.caption, { color: c.accentPrimary }]}>{chart.ascendant.sign} Lagna</Text></View>
              {chart.atmakaraka ? <View style={s.pill}><Text style={[type.caption, { color: c.accentPrimary }]}>AK: {chart.atmakaraka}</Text></View> : null}
              <View style={s.pill}><Text style={[type.caption, { color: c.textSecondary, textTransform: 'capitalize' }]}>{chart.ayanamsa}</Text></View>
            </View>
            <View style={s.card}>
              <Text style={[type.micro, s.cardLabel]}>D1 · RĀŚI</Text>
              <View style={{ alignItems: 'center' }}>
                <NorthIndianChart size={300} ascSignIndex={chart.ascendant.sign_index} planetHouseMap={chart.planet_house_map} planets={chart.planets} />
              </View>
            </View>
            <View style={s.card}>
              <Text style={[type.micro, s.cardLabel]}>PLANETS</Text>
              <PlanetTable c={c} s={s} planets={chart.planets} />
            </View>
          </>
        )}

        {section === 'vargas' && (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: 8 }}>
              {VARGAS.map((v) => (
                <Pressable key={v.d} onPress={() => loadVarga(v.d)} style={[s.chip, vNum === v.d && s.chipOn]}>
                  <Text style={[type.bodyMed, { color: vNum === v.d ? c.onAccent : c.textSecondary }]}>D{v.d}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={s.card}>
              <Text style={[type.micro, s.cardLabel]}>{cur?.name?.toUpperCase() || `D${vNum}`}{cur?.domain ? ` · ${cur.domain}` : ''}</Text>
              {vLoading || !cur ? (
                <View style={{ height: 300, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={c.accentPrimary} /></View>
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <NorthIndianChart size={300} ascSignIndex={cur.ascendant.sign_index} planetHouseMap={cur.planet_house_map} planets={cur.planets} />
                </View>
              )}
            </View>
            {cur && !vLoading ? <View style={s.card}><Text style={[type.micro, s.cardLabel]}>PLANETS · D{vNum}</Text><PlanetTable c={c} s={s} planets={cur.planets} /></View> : null}
          </>
        )}

        {section === 'dasha' && (
          <View style={s.card}>
            <Text style={[type.micro, s.cardLabel]}>VIMŚOTTARĪ MAHĀDAŚĀ</Text>
            {(chart.dashas || []).map((d, i) => {
              const now = new Date();
              const active = new Date(String(d.start)) <= now && now < new Date(String(d.end));
              return (
                <View key={i} style={[s.drow, active && { backgroundColor: c.accentBg, borderRadius: radius.sm }]}>
                  <Text style={[type.bodyMed, { color: active ? c.accentPrimary : c.textPrimary, width: 78 }]}>{d.lord}{active ? ' •' : ''}</Text>
                  <Text style={[type.caption, { color: c.textMuted, flex: 1 }]}>{String(d.start).slice(0,10)} → {String(d.end).slice(0,10)}</Text>
                  <Text style={[type.caption, { color: c.textMuted }]}>{Math.round(d.years)}y</Text>
                </View>
              );
            })}
            <Text style={[type.caption, { color: c.textMuted, marginTop: spacing.sm }]}>Antardaśā drill-down coming next.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function PlanetTable({ c, s, planets }: any) {
  return (
    <>
      <View style={[s.trow, { borderBottomWidth: 1, borderBottomColor: c.borderCard, paddingBottom: 6 }]}>
        <Text style={[type.micro, s.th, { flex: 1.4 }]}>PLANET</Text>
        <Text style={[type.micro, s.th, { flex: 1.4 }]}>SIGN</Text>
        <Text style={[type.micro, s.th, { width: 40, textAlign: 'right' }]}>DEG</Text>
        <Text style={[type.micro, s.th, { flex: 1.6 }]}>NAKṢATRA</Text>
      </View>
      {ORDER.filter((n) => planets[n]).map((n) => {
        const p = planets[n];
        return (
          <View key={n} style={s.trow}>
            <Text style={[type.bodyMed, { color: c.textPrimary, flex: 1.4 }]}>{n}{p.retrograde ? ' ↺' : ''}</Text>
            <Text style={[type.body, { color: c.textSecondary, flex: 1.4 }]}>{p.sign}</Text>
            <Text style={[type.body, { color: c.textSecondary, width: 40, textAlign: 'right' }]}>{Math.round(p.degree)}°</Text>
            <Text style={[type.body, { color: c.textMuted, flex: 1.6 }]} numberOfLines={1}>{p.nakshatra}</Text>
          </View>
        );
      })}
    </>
  );
}

const makeStyles = (c: Colors) => StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.sm, paddingBottom: spacing.sm },
  iconBtn: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  seg: { flexDirection: 'row', marginHorizontal: spacing.lg, marginBottom: spacing.sm, backgroundColor: c.bgCard, borderRadius: radius.md, borderWidth: 1, borderColor: c.borderCard, padding: 3 },
  segItem: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: radius.sm },
  segItemOn: { backgroundColor: c.accentPrimary },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: spacing.lg, marginBottom: spacing.sm, marginTop: spacing.sm },
  pill: { backgroundColor: c.pillActiveBg, borderRadius: radius.pill, paddingVertical: 5, paddingHorizontal: 12 },
  card: { backgroundColor: c.bgCard, borderColor: c.borderCard, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, marginHorizontal: spacing.lg, marginTop: spacing.sm },
  cardLabel: { color: c.textMuted, marginBottom: spacing.sm },
  chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 1, borderColor: c.borderCard, backgroundColor: c.bgCard },
  chipOn: { backgroundColor: c.accentPrimary, borderColor: c.accentPrimary },
  trow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  drow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 6 },
  th: { color: c.textMuted },
});
