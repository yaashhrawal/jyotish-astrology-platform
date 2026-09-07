import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useColors } from '../store/theme';
import { Colors, radius, spacing } from '../theme/theme';
import { type } from '../theme/typography';
import { BirthData, getInterpretTopics, getInterpret } from '../api/astro';
import { apiError } from '../api/client';
import { useLangStore } from '../i18n';

export default function ReadingSection({ birth }: { birth: BirthData }) {
  const c = useColors();
  const lang = useLangStore((st) => st.lang);
  const s = useMemo(() => makeStyles(c), [c]);
  const [topics, setTopics] = useState<{ key: string; label: string }[]>([]);
  const [topic, setTopic] = useState('career');
  const [data, setData] = useState<Record<string, any>>({});   // keyed by `${topic}:${lang}`
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { getInterpretTopics().then(setTopics).catch(() => {}); }, []);

  const load = useCallback(async (topicKey: string) => {
    setTopic(topicKey);
    const cacheKey = `${topicKey}:${lang}`;
    if (data[cacheKey]) return;
    setLoading(true); setError('');
    try { const r = await getInterpret(birth, topicKey, lang); setData((p) => ({ ...p, [cacheKey]: r })); }
    catch (e) { setError(apiError(e)); }
    finally { setLoading(false); }
  }, [birth, data, lang]);

  useEffect(() => { load(topic); }, [lang]);   // (re)load current topic in the active language
  useEffect(() => { load('career'); }, []);

  const cur = data[`${topic}:${lang}`];
  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 8, paddingBottom: spacing.sm }}>
        {topics.map((t) => (
          <Pressable key={t.key} onPress={() => load(t.key)} style={[s.chip, topic === t.key && s.chipOn]}>
            <Text style={[type.caption, { color: topic === t.key ? c.onAccent : c.textSecondary }]} numberOfLines={1}>{t.label.split(',')[0].split(' and ')[0]}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={s.card}>
        {loading ? <View style={{ height: 100, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={c.accentPrimary} /></View> :
         error ? <Text style={[type.body, { color: c.accentRed }]}>{error}</Text> :
         !cur ? null :
         (cur.results || []).map((r: any, i: number) => (
           <View key={i} style={{ marginBottom: spacing.md }}>
             <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
               <Text style={[type.cardTitle, { color: c.textPrimary, flex: 1 }]}>{r.label}</Text>
               {r.tension ? <View style={[s.pill, { backgroundColor: c.accentBg }]}><Text style={[type.micro, { color: c.accentPrimary }]}>MIXED</Text></View> : null}
             </View>
             {r.narrative?.headline ? <Text style={[type.body, { color: c.textSecondary, marginTop: 4 }]}>{r.narrative.headline}</Text> : null}
             {(r.narrative?.statements || []).map((st: any, j: number) => (
               <View key={j} style={{ marginTop: 8, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: c.borderStrong }}>
                 <Text style={[type.body, { color: c.textPrimary }]}>{st.text}</Text>
                 {st.detail ? <Text style={[type.caption, { color: c.textMuted, marginTop: 2 }]}>{st.detail}</Text> : null}
                 {st.rule ? <Text style={[type.caption, { color: c.accentPrimary, marginTop: 2 }]}>Rule: {st.rule}</Text> : null}
               </View>
             ))}
           </View>
         ))}
      </View>
    </View>
  );
}

const makeStyles = (c: Colors) => StyleSheet.create({
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1, borderColor: c.borderCard, backgroundColor: c.bgCard, maxWidth: 160 },
  chipOn: { backgroundColor: c.accentPrimary, borderColor: c.accentPrimary },
  card: { backgroundColor: c.bgCard, borderColor: c.borderCard, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, marginHorizontal: spacing.lg, marginTop: spacing.sm },
  pill: { borderRadius: radius.pill, paddingVertical: 3, paddingHorizontal: 8 },
});
