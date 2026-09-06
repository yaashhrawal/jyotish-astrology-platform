import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../store/theme';
import { Colors, radius, spacing } from '../theme/theme';
import { type } from '../theme/typography';
import { ChartResponse } from '../api/astro';
import NorthIndianChart from '../components/NorthIndianChart';

const ORDER = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];

export default function ChartScreen({ route, navigation }: any) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => makeStyles(c), [c]);
  const chart: ChartResponse = route.params?.chart;

  if (!chart) {
    return <View style={[s.center]}><Text style={[type.body, { color: c.textMuted }]}>No chart.</Text></View>;
  }

  return (
    <ScrollView style={{ backgroundColor: c.bgBody }} contentContainerStyle={{ paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + 32 }}>
      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()} style={s.iconBtn}><Ionicons name="chevron-back" size={22} color={c.textPrimary} /></Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[type.sectionTitle, { color: c.textPrimary }]} numberOfLines={1}>{chart.name}</Text>
          <Text style={[type.caption, { color: c.textMuted }]}>{chart.birth} · {chart.place}</Text>
        </View>
      </View>

      {/* summary pills */}
      <View style={s.pillRow}>
        <View style={s.pill}><Text style={[type.caption, { color: c.accentPrimary }]}>{chart.ascendant.sign} Lagna</Text></View>
        {chart.atmakaraka ? <View style={s.pill}><Text style={[type.caption, { color: c.accentPrimary }]}>AK: {chart.atmakaraka}</Text></View> : null}
        <View style={s.pill}><Text style={[type.caption, { color: c.textSecondary, textTransform: 'capitalize' }]}>{chart.ayanamsa}</Text></View>
      </View>

      {/* D1 chart */}
      <View style={s.card}>
        <Text style={[type.micro, { color: c.textMuted, marginBottom: spacing.sm }]}>D1 · RĀŚI</Text>
        <View style={{ alignItems: 'center' }}>
          <NorthIndianChart size={300} ascSignIndex={chart.ascendant.sign_index} planetHouseMap={chart.planet_house_map} planets={chart.planets} />
        </View>
      </View>

      {/* planets table */}
      <View style={s.card}>
        <Text style={[type.micro, { color: c.textMuted, marginBottom: spacing.sm }]}>PLANETS</Text>
        <View style={[s.trow, { borderBottomWidth: 1, borderBottomColor: c.borderCard, paddingBottom: 6 }]}>
          <Text style={[type.micro, s.th, { flex: 1.4 }]}>PLANET</Text>
          <Text style={[type.micro, s.th, { flex: 1.4 }]}>SIGN</Text>
          <Text style={[type.micro, s.th, { width: 42, textAlign: 'right' }]}>DEG</Text>
          <Text style={[type.micro, s.th, { flex: 1.6 }]}>NAKṢATRA</Text>
        </View>
        {ORDER.filter((n) => chart.planets[n]).map((n) => {
          const p = chart.planets[n];
          return (
            <View key={n} style={s.trow}>
              <Text style={[type.bodyMed, { color: c.textPrimary, flex: 1.4 }]}>{n}{p.retrograde ? ' ↺' : ''}</Text>
              <Text style={[type.body, { color: c.textSecondary, flex: 1.4 }]}>{p.sign}</Text>
              <Text style={[type.body, { color: c.textSecondary, width: 42, textAlign: 'right' }]}>{p.degree?.toFixed?.(0)}°</Text>
              <Text style={[type.body, { color: c.textMuted, flex: 1.6 }]} numberOfLines={1}>{p.nakshatra}</Text>
            </View>
          );
        })}
      </View>

      {/* dasha preview */}
      {chart.dashas?.length ? (
        <View style={s.card}>
          <Text style={[type.micro, { color: c.textMuted, marginBottom: spacing.sm }]}>VIMŚOTTARĪ DAŚĀ</Text>
          {chart.dashas.slice(0, 6).map((d, i) => (
            <View key={i} style={s.trow}>
              <Text style={[type.bodyMed, { color: c.textPrimary, flex: 1 }]}>{d.lord}</Text>
              <Text style={[type.body, { color: c.textMuted }]}>{String(d.start).slice(0, 10)} → {String(d.end).slice(0, 10)}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const makeStyles = (c: Colors) => StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  iconBtn: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  pill: { backgroundColor: c.pillActiveBg, borderRadius: radius.pill, paddingVertical: 5, paddingHorizontal: 12 },
  card: { backgroundColor: c.bgCard, borderColor: c.borderCard, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, margin: spacing.lg, marginTop: spacing.sm },
  trow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  th: { color: c.textMuted },
});
