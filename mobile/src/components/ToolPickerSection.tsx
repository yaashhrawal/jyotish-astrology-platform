import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useColors } from '../store/theme';
import { Colors, radius, spacing } from '../theme/theme';
import { type } from '../theme/typography';
import { BirthData, calcTool } from '../api/astro';
import { apiError } from '../api/client';
import GenericResult from './GenericResult';

export interface Tool { key: string; ep: string; label: string }
type Renderers = Record<string, (data: any) => React.ReactNode>;

export default function ToolPickerSection({ birth, tools, initial, renderers }: { birth: BirthData; tools: Tool[]; initial?: string; renderers?: Renderers }) {
  const c = useColors();
  const s = useMemo(() => makeStyles(c), [c]);
  const [sel, setSel] = useState(initial || tools[0].key);
  const [data, setData] = useState<Record<string, any>>({});
  const [status, setStatus] = useState<Record<string, 'loading' | 'idle' | 'error'>>({});
  const [err, setErr] = useState<Record<string, string>>({});

  const load = useCallback(async (key: string) => {
    const t = tools.find((x) => x.key === key)!;
    if (data[key] || status[key] === 'loading') return;
    setStatus((p) => ({ ...p, [key]: 'loading' }));
    try { const r = await calcTool(t.ep, birth); setData((p) => ({ ...p, [key]: r })); setStatus((p) => ({ ...p, [key]: 'idle' })); }
    catch (e) { setErr((p) => ({ ...p, [key]: apiError(e) })); setStatus((p) => ({ ...p, [key]: 'error' })); }
  }, [birth, tools, data, status]);

  useEffect(() => { load(sel); }, [sel, load]);

  const t = tools.find((x) => x.key === sel)!;
  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ height: 52 }} contentContainerStyle={s.chipRow}>
        {tools.map((tl) => (
          <Pressable key={tl.key} onPress={() => setSel(tl.key)} style={[s.chip, sel === tl.key && s.chipOn]}>
            <Text allowFontScaling={false} style={{ fontFamily: type.bodyMed.fontFamily, fontSize: 13, lineHeight: 20, color: sel === tl.key ? c.onAccent : c.textSecondary }}>{tl.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={s.card}>
        <Text style={[type.micro, { color: c.textMuted, marginBottom: spacing.sm }]}>{t.label.toUpperCase()}</Text>
        {status[sel] === 'loading' ? <View style={{ height: 100, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={c.accentPrimary} /></View> :
         status[sel] === 'error' ? <Text style={[type.body, { color: c.accentRed }]}>{err[sel]}</Text> :
         !data[sel] ? null :
         renderers?.[sel] ? (
           <View>
             {renderers[sel](data[sel])}
             <View style={{ height: spacing.md }} />
             <GenericResult data={data[sel]} />
           </View>
         ) : <GenericResult data={data[sel]} />}
      </View>
    </View>
  );
}

const makeStyles = (c: Colors) => StyleSheet.create({
  chipRow: { paddingHorizontal: spacing.lg, gap: 8, alignItems: 'center', height: 52 },
  chip: { justifyContent: 'center', height: 38, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1, borderColor: c.borderCard, backgroundColor: c.bgCard },
  chipOn: { backgroundColor: c.accentPrimary, borderColor: c.accentPrimary },
  card: { backgroundColor: c.bgCard, borderColor: c.borderCard, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, marginHorizontal: spacing.lg, marginTop: spacing.sm },
});
