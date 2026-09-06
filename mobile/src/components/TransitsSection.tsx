import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../store/theme';
import { Colors, radius, spacing } from '../theme/theme';
import { type } from '../theme/typography';
import { BirthData, getGochara } from '../api/astro';
import { apiError } from '../api/client';

export default function TransitsSection({ birth }: { birth: BirthData }) {
  const c = useColors();
  const s = useMemo(() => makeStyles(c), [c]);
  const [d, setD] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getGochara(birth).then(setD).catch((e) => setError(apiError(e))).finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={s.card}><ActivityIndicator color={c.accentPrimary} /></View>;
  if (error) return <View style={s.card}><Text style={[type.body, { color: c.accentRed }]}>{error}</Text></View>;

  return (
    <View style={s.card}>
      <Text style={[type.micro, { color: c.textMuted, marginBottom: 2 }]}>GOCHARA · from natal Moon ({d?.natal_moon_sign})</Text>
      {d?.overall ? <Text style={[type.body, { color: c.textSecondary, marginBottom: spacing.sm }]}>{typeof d.overall === 'string' ? d.overall : `${d.favorable_count} favourable · ${d.unfavorable_count} difficult`}</Text> : null}
      <View style={[s.row, { borderBottomWidth: 1, borderBottomColor: c.borderCard, paddingBottom: 6 }]}>
        <Text style={[type.micro, s.th, { flex: 1.2 }]}>PLANET</Text>
        <Text style={[type.micro, s.th, { flex: 1.4 }]}>TRANSIT SIGN</Text>
        <Text style={[type.micro, s.th, { width: 44, textAlign: 'center' }]}>H/Moon</Text>
        <Text style={[type.micro, s.th, { width: 24 }]}></Text>
      </View>
      {(d?.planets || []).map((p: any, i: number) => (
        <View key={i} style={s.row}>
          <Text style={[type.bodyMed, { color: c.textPrimary, flex: 1.2 }]}>{p.planet}</Text>
          <Text style={[type.body, { color: c.textSecondary, flex: 1.4 }]}>{p.transit_sign}</Text>
          <Text style={[type.body, { color: c.textSecondary, width: 44, textAlign: 'center' }]}>{p.house_from_moon}</Text>
          <Ionicons name={p.favorable ? 'arrow-up' : 'arrow-down'} size={14} color={p.favorable ? c.accentGreen : c.accentRed} style={{ width: 24, textAlign: 'right' }} />
        </View>
      ))}
      {d?.ashtama_planets?.length ? <Text style={[type.caption, { color: c.accentRed, marginTop: spacing.sm }]}>Aṣṭama (8th) transit: {d.ashtama_planets.join(', ')}</Text> : null}
    </View>
  );
}

const makeStyles = (c: Colors) => StyleSheet.create({
  card: { backgroundColor: c.bgCard, borderColor: c.borderCard, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, marginHorizontal: spacing.lg, marginTop: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  th: { color: c.textMuted },
});
