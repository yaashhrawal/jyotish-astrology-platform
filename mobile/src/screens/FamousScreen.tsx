import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useT } from '../i18n';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../store/theme';
import { Colors, radius, spacing } from '../theme/theme';
import { type } from '../theme/typography';
import { getFamousCharts, getChart } from '../api/astro';
import { apiError } from '../api/client';
import { Loading, ErrorState } from '../components/AsyncStates';

export default function FamousScreen({ navigation }: any) {
  const c = useColors();
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => makeStyles(c), [c]);
  const [rows, setRows] = useState<any[]>([]);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');
  const [error, setError] = useState('');
  const [opening, setOpening] = useState<string | null>(null);

  const load = async () => {
    setStatus('loading');
    try { setRows(await getFamousCharts()); setStatus('idle'); }
    catch (e) { setError(apiError(e)); setStatus('error'); }
  };
  useEffect(() => { load(); }, []);

  const open = async (row: any) => {
    setOpening(row.id || row.name);
    try {
      const birth = {
        name: row.name, year: row.year, month: row.month, day: row.day, hour: row.hour, minute: row.minute,
        tz_offset: row.tz_offset ?? 5.5, latitude: row.latitude, longitude: row.longitude,
        place: row.place || '', ayanamsa: 'lahiri',
      } as any;
      const chart = await getChart(birth);
      navigation.navigate('Chart', { chart, birth });
    } catch (e) { setError(apiError(e)); } finally { setOpening(null); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bgBody, paddingTop: insets.top }}>
      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()} style={s.iconBtn}><Ionicons name="chevron-back" size={22} color={c.textPrimary} /></Pressable>
        <Text style={[type.screenTitle, { color: c.textPrimary }]}>{t('Famous Charts')}</Text>
      </View>
      {status === 'loading' ? <Loading /> :
       status === 'error' ? <ErrorState message={error} onRetry={load} /> :
      (
        <FlatList
          data={rows}
          keyExtractor={(it, i) => it.id || String(i)}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 24 }}
          renderItem={({ item }) => (
            <Pressable style={s.card} onPress={() => open(item)}>
              <View style={s.pf}><Text style={[type.cardTitle, { color: c.onAccent }]}>{item.name?.[0]}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={[type.cardTitle, { color: c.textPrimary }]} numberOfLines={1}>{item.name}</Text>
                <Text style={[type.caption, { color: c.textMuted }]} numberOfLines={1}>{item.category} · {item.place}</Text>
              </View>
              {opening === (item.id || item.name) ? <ActivityIndicator color={c.accentPrimary} /> : <Ionicons name="chevron-forward" size={16} color={c.textMuted} />}
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const makeStyles = (c: Colors) => StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.sm, paddingBottom: spacing.sm },
  iconBtn: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.bgCard, borderColor: c.borderCard, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  pf: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.accentPrimary, alignItems: 'center', justifyContent: 'center' },
});
