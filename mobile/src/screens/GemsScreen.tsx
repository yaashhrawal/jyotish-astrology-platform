import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useT } from '../i18n';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../store/theme';
import { Colors, radius, spacing } from '../theme/theme';
import { type } from '../theme/typography';
import { gemsCatalog } from '../api/astro';
import { apiError } from '../api/client';
import { Loading, ErrorState, EmptyState } from '../components/AsyncStates';

const GEM_COLOR: Record<string, string> = {
  Jupiter: '#E0B24A', Sun: '#C0392B', Mars: '#B33A3A', Mercury: '#3B8C5A',
  Venus: '#D9D2C0', Moon: '#E8E8EC', Saturn: '#3A5BA0', Rahu: '#5B4B8A', Ketu: '#8A6A4B',
};

export default function GemsScreen({ navigation }: any) {
  const c = useColors();
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => makeStyles(c), [c]);
  const [rows, setRows] = useState<any[]>([]);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');
  const [error, setError] = useState('');

  const load = async () => {
    setStatus('loading');
    try { setRows(await gemsCatalog()); setStatus('idle'); }
    catch (e) { setError(apiError(e)); setStatus('error'); }
  };
  useEffect(() => { load(); }, []);

  return (
    <View style={{ flex: 1, backgroundColor: c.bgBody, paddingTop: insets.top }}>
      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()} style={s.iconBtn}><Ionicons name="chevron-back" size={22} color={c.textPrimary} /></Pressable>
        <Text style={[type.screenTitle, { color: c.textPrimary }]}>{t('Gems')}</Text>
      </View>
      {status === 'loading' ? <Loading /> :
       status === 'error' ? <ErrorState message={error} onRetry={load} /> :
       rows.length === 0 ? <EmptyState icon="diamond-outline" title="No gems in catalog" /> :
      (
        <FlatList
          data={rows}
          keyExtractor={(it, i) => it.id || String(i)}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 24 }}
          ListHeaderComponent={<Text style={[type.body, { color: c.textMuted, marginBottom: spacing.md }]}>Certified, energised stones by planet. Tap to enquire.</Text>}
          renderItem={({ item }) => (
            <Pressable style={s.card}>
              <View style={[s.sw, { backgroundColor: GEM_COLOR[item.planet] || c.accentSecondary }]} />
              <View style={{ flex: 1 }}>
                <Text style={[type.cardTitle, { color: c.textPrimary }]}>{item.name}</Text>
                <Text style={[type.caption, { color: c.accentPrimary }]}>{item.sanskrit_name} · {item.planet}</Text>
                <Text style={[type.caption, { color: c.textMuted, marginTop: 2 }]}>
                  {(item.rashi || []).join(', ')} · {item.carat_default || item.carat_min}ct
                </Text>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.sm, paddingBottom: spacing.sm },
  iconBtn: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.bgCard, borderColor: c.borderCard, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  sw: { width: 44, height: 44, borderRadius: 10 },
});
