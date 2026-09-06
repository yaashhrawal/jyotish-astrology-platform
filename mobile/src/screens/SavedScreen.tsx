import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../store/theme';
import { useAuth } from '../store/auth';
import { Colors, radius, spacing } from '../theme/theme';
import { type } from '../theme/typography';
import { api, apiError } from '../api/client';
import { getChart } from '../api/astro';
import { Loading, EmptyState, ErrorState } from '../components/AsyncStates';

export default function SavedScreen({ navigation }: any) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => makeStyles(c), [c]);
  const user = useAuth((st) => st.user);

  const [rows, setRows] = useState<any[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    setStatus('loading');
    try {
      const r = await api.get('/api/charts/list');
      setRows(r.data?.charts || r.data || []);
      setStatus('idle');
    } catch (e) {
      setError(apiError(e)); setStatus('error');
    }
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const open = async (row: any) => {
    try {
      const [y, mo, d] = (row.birth_date || '1990-01-01').split('-').map(Number);
      const [h, mi] = (row.birth_time || '12:00').split(':').map(Number);
      const birth = {
        name: row.name || 'Saved', year: y, month: mo, day: d, hour: h, minute: mi,
        tz_offset: row.birth_tz ?? 5.5, latitude: row.latitude ?? 28.6, longitude: row.longitude ?? 77.2,
        place: row.birth_place || '', ayanamsa: row.ayanamsa || 'lahiri',
      } as any;
      const chart = await getChart(birth);
      // pass birth so Vargas / Dāśā / Reading / Transits / Analysis can compute
      navigation.navigate('Chart', { chart, birth });
    } catch (e) { setError(apiError(e)); }
  };

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bgBody, paddingTop: insets.top }}>
        <Text style={[type.screenTitle, s.title]}>Saved Charts</Text>
        <EmptyState icon="bookmark-outline" title="Sign in to sync" subtitle="Your saved charts appear here — synced across iPhone, iPad and web." />
        <Pressable style={s.cta} onPress={() => navigation.navigate('Auth')}><Text style={[type.button, { color: '#fff' }]}>Log in / Create account</Text></Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bgBody, paddingTop: insets.top }}>
      <Text style={[type.screenTitle, s.title]}>Saved Charts</Text>
      {status === 'loading' && rows.length === 0 ? <Loading /> :
       status === 'error' ? <ErrorState message={error} onRetry={load} /> :
       rows.length === 0 ? <EmptyState icon="bookmark-outline" title="No saved charts yet" subtitle="Calculate a chart and save it to see it here." /> :
      (
        <FlatList
          data={rows}
          keyExtractor={(it, i) => it.id || String(i)}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 24 }}
          refreshControl={<RefreshControl refreshing={status === 'loading'} onRefresh={load} tintColor={c.accentPrimary} />}
          renderItem={({ item }) => (
            <Pressable style={s.item} onPress={() => open(item)}>
              <View style={s.sq}><Ionicons name="planet-outline" size={18} color={c.accentPrimary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[type.cardTitle, { color: c.textPrimary }]} numberOfLines={1}>{item.name || 'Chart'}</Text>
                <Text style={[type.caption, { color: c.textMuted }]} numberOfLines={1}>{item.birth_date} · {item.birth_place}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const makeStyles = (c: Colors) => StyleSheet.create({
  title: { color: c.textPrimary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.bgCard, borderColor: c.borderCard, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  sq: { width: 40, height: 40, borderRadius: 10, backgroundColor: c.accentBg, alignItems: 'center', justifyContent: 'center' },
  cta: { height: 50, marginHorizontal: spacing.xl, borderRadius: radius.lg, backgroundColor: c.accentPrimary, alignItems: 'center', justifyContent: 'center' },
});
