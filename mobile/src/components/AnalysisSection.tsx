import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useColors } from '../store/theme';
import { Colors, radius, spacing } from '../theme/theme';
import { type } from '../theme/typography';
import { BirthData, getYogas, getAshtakavarga, getShadbala, getAspects, getDoshas, getKarakas, getArudha } from '../api/astro';
import { apiError } from '../api/client';

const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SIGN3 = (s: string) => s.slice(0, 3);
const PLANETS = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];
const TABS = [
  { k: 'yogas', label: 'Yogas' },
  { k: 'doshas', label: 'Doshas' },
  { k: 'karakas', label: 'Karakas' },
  { k: 'arudha', label: 'Arudha' },
  { k: 'av', label: 'Aṣṭakavarga' },
  { k: 'bala', label: 'Ṣaḍbala' },
  { k: 'aspects', label: 'Aspects' },
] as const;
type Tab = typeof TABS[number]['k'];

export default function AnalysisSection({ birth }: { birth: BirthData }) {
  const c = useColors();
  const s = useMemo(() => makeStyles(c), [c]);
  const [tab, setTab] = useState<Tab>('yogas');
  const [data, setData] = useState<Record<string, any>>({});
  const [status, setStatus] = useState<Record<string, 'idle' | 'loading' | 'error'>>({});
  const [err, setErr] = useState<Record<string, string>>({});

  const load = useCallback(async (t: Tab) => {
    if (data[t] || status[t] === 'loading') return;
    setStatus((p) => ({ ...p, [t]: 'loading' }));
    try {
      const map: Record<Tab, (b: BirthData) => Promise<any>> = {
        yogas: getYogas, doshas: getDoshas, karakas: getKarakas, arudha: getArudha,
        av: getAshtakavarga, bala: getShadbala, aspects: getAspects,
      };
      const r = await map[t](birth);
      setData((p) => ({ ...p, [t]: r })); setStatus((p) => ({ ...p, [t]: 'idle' }));
    } catch (e) { setErr((p) => ({ ...p, [t]: apiError(e) })); setStatus((p) => ({ ...p, [t]: 'error' })); }
  }, [birth, data, status]);

  useEffect(() => { load(tab); }, [tab, load]);

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 8, paddingBottom: spacing.sm }}>
        {TABS.map((t) => (
          <Pressable key={t.k} onPress={() => setTab(t.k)} style={[s.chip, tab === t.k && s.chipOn]}>
            <Text style={[type.bodyMed, { color: tab === t.k ? c.onAccent : c.textSecondary }]}>{t.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={s.card}>
        {status[tab] === 'loading' ? <View style={{ height: 120, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={c.accentPrimary} /></View> :
         status[tab] === 'error' ? <Text style={[type.body, { color: c.accentRed }]}>{err[tab]}</Text> :
         !data[tab] ? null :
         tab === 'yogas' ? <Yogas c={c} s={s} d={data.yogas} /> :
         tab === 'doshas' ? <Doshas c={c} s={s} d={data.doshas} /> :
         tab === 'karakas' ? <Karakas c={c} s={s} d={data.karakas} /> :
         tab === 'arudha' ? <Arudha c={c} s={s} d={data.arudha} /> :
         tab === 'av' ? <Ashtakavarga c={c} s={s} d={data.av} /> :
         tab === 'bala' ? <Shadbala c={c} s={s} d={data.bala} /> :
         <Aspects c={c} s={s} d={data.aspects} />}
      </View>
    </View>
  );
}

function Yogas({ c, s, d }: any) {
  const yogas = d?.yogas || [];
  if (!yogas.length) return <Text style={[type.body, { color: c.textMuted }]}>No major yogas detected.</Text>;
  return (
    <>
      <Text style={[type.micro, s.lbl]}>{d.total_yogas} YOGAS</Text>
      {yogas.map((y: any, i: number) => (
        <View key={i} style={s.yoga}>
          <View style={s.yogaHead}>
            <Text style={[type.cardTitle, { color: c.textPrimary, flex: 1 }]}>{y.name}</Text>
            <View style={[s.pill, { backgroundColor: c.accentBg }]}><Text style={[type.micro, { color: c.accentPrimary }]}>{String(y.strength || '').toUpperCase()}</Text></View>
          </View>
          <Text style={[type.caption, { color: c.accentPrimary, marginTop: 1 }]}>{y.type}</Text>
          <Text style={[type.body, { color: c.textSecondary, marginTop: 4 }]}>{y.description}</Text>
        </View>
      ))}
    </>
  );
}

function Ashtakavarga({ c, s, d }: any) {
  const sav = d?.sarvashtakavarga || {};
  const bav = d?.bhinnashtakavarga || {};
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
        <View style={[s.trow, s.trhead]}>
          <Text style={[type.micro, s.th, { width: 58 }]}>PLANET</Text>
          {SIGNS.map((sg) => <Text key={sg} style={[type.micro, s.th, { width: 30, textAlign: 'center' }]}>{sg.slice(0,2)}</Text>)}
        </View>
        {PLANETS.map((p) => (
          <View key={p} style={s.trow}>
            <Text style={[type.caption, { color: c.textPrimary, width: 58 }]}>{p}</Text>
            {SIGNS.map((sg) => <Text key={sg} style={[type.caption, { color: c.textSecondary, width: 30, textAlign: 'center' }]}>{bav[p]?.[sg] ?? '·'}</Text>)}
          </View>
        ))}
        <View style={[s.trow, { borderTopWidth: 1, borderTopColor: c.borderStrong, marginTop: 4, paddingTop: 6 }]}>
          <Text style={[type.micro, s.th, { width: 58 }]}>SAV</Text>
          {SIGNS.map((sg) => <Text key={sg} style={[type.caption, { color: c.accentPrimary, width: 30, textAlign: 'center', fontWeight: '700' }]}>{sav[sg] ?? '·'}</Text>)}
        </View>
      </View>
    </ScrollView>
  );
}

function Shadbala({ c, s, d }: any) {
  const sb = d?.shadbala || {};
  return (
    <>
      {Object.entries(sb).map(([p, v]: any) => {
        const pct = Math.min(1, (v.total_rupas || 0) / (v.required_rupas || 5));
        return (
          <View key={p} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[type.bodyMed, { color: c.textPrimary }]}>{p}</Text>
              <Text style={[type.caption, { color: v.sufficient ? c.accentGreen : c.accentRed }]}>
                {v.total_rupas?.toFixed(2)} / {v.required_rupas} rūpa {v.sufficient ? '✓' : ''}
              </Text>
            </View>
            <View style={s.barBg}><View style={[s.barFill, { width: `${pct * 100}%`, backgroundColor: v.sufficient ? c.accentGreen : c.accentPrimary }]} /></View>
          </View>
        );
      })}
      <Text style={[type.caption, { color: c.textMuted, marginTop: 2 }]}>Sthāna · Dig · Kāla · Naisargika · Dṛk (indicative — Cheṣṭā pending).</Text>
    </>
  );
}

function Aspects({ c, s, d }: any) {
  const asp = (d?.parashari_aspects || []).filter((a: any) => a.aspected_planets?.length);
  if (!asp.length) return <Text style={[type.body, { color: c.textMuted }]}>No planet-to-planet aspects.</Text>;
  return (
    <>
      <Text style={[type.micro, s.lbl]}>PĀRĀŚARĪ GRAHA DṚṢṬI</Text>
      {asp.map((a: any, i: number) => (
        <View key={i} style={s.aspRow}>
          <Text style={[type.bodyMed, { color: c.accentPrimary, width: 62 }]}>{a.aspector}</Text>
          <Text style={[type.caption, { color: c.textMuted, width: 52 }]}>{a.aspect_type?.replace(' house','H')}</Text>
          <Text style={[type.body, { color: c.textSecondary, flex: 1 }]}>→ {a.aspected_planets.join(', ')} <Text style={{ color: c.textMuted }}>(H{a.target_house} {SIGN3(a.target_sign || '')})</Text></Text>
        </View>
      ))}
    </>
  );
}

function Doshas({ c, s, d }: any) {
  const items = [
    { k: 'Mangal (Kuja) Dosha', v: d?.mangal_dosha },
    { k: 'Kāla Sarpa Dosha', v: d?.kalsarpa_dosha },
    { k: 'Sade Sati', v: d?.sadesati },
  ];
  return (
    <>
      {items.map(({ k, v }) => {
        const has = v?.has_dosha ?? v?.active ?? v?.is_active;
        return (
          <View key={k} style={s.yoga}>
            <View style={s.yogaHead}>
              <Text style={[type.cardTitle, { color: c.textPrimary, flex: 1 }]}>{k}</Text>
              <View style={[s.pill, { backgroundColor: has ? c.accentBg : c.tagBg }]}>
                <Text style={[type.micro, { color: has ? c.accentRed : c.accentGreen }]}>{has ? (v?.severity || 'PRESENT') : 'CLEAR'}</Text>
              </View>
            </View>
            {v?.triggers?.length ? <Text style={[type.caption, { color: c.textMuted, marginTop: 4 }]}>{v.triggers.join(' · ')}</Text> : null}
            {v?.phase ? <Text style={[type.caption, { color: c.textMuted, marginTop: 4 }]}>{v.phase}</Text> : null}
          </View>
        );
      })}
      {d?.summary ? <Text style={[type.body, { color: c.textSecondary, marginTop: spacing.sm }]}>{typeof d.summary === 'string' ? d.summary : ''}</Text> : null}
    </>
  );
}

function Karakas({ c, s, d }: any) {
  const ks = d?.karakas || [];
  return (
    <>
      <Text style={[type.micro, s.lbl]}>CHARA KARAKAS · AK: {d?.atmakaraka}</Text>
      {ks.map((k: any, i: number) => (
        <View key={i} style={s.trow}>
          <Text style={[type.bodyMed, { color: c.accentPrimary, width: 44 }]}>{k.karaka}</Text>
          <Text style={[type.body, { color: c.textPrimary, width: 78 }]}>{k.planet}</Text>
          <Text style={[type.body, { color: c.textSecondary, flex: 1 }]}>{k.sign} {Math.round(k.degree_in_sign)}°</Text>
          <Text style={[type.caption, { color: c.textMuted }]}>D9 {SIGN3(k.navamsha_sign || '')}</Text>
        </View>
      ))}
      {d?.karakamsha_sign ? <Text style={[type.caption, { color: c.textMuted, marginTop: spacing.sm }]}>Kārakāṁśa: {d.karakamsha_sign} (H{d.karakamsha_house})</Text> : null}
    </>
  );
}

function Arudha({ c, s, d }: any) {
  const ar = d?.arudhas || [];
  return (
    <>
      <Text style={[type.micro, s.lbl]}>ARUDHA PADAS</Text>
      {ar.map((a: any, i: number) => (
        <View key={i} style={s.trow}>
          <Text style={[type.bodyMed, { color: c.accentPrimary, width: 44 }]}>{a.code}</Text>
          <Text style={[type.body, { color: c.textSecondary, flex: 1 }]}>{a.name}</Text>
          <Text style={[type.body, { color: c.textPrimary }]}>{a.sign}</Text>
        </View>
      ))}
      {d?.upapada?.sign ? <Text style={[type.caption, { color: c.textMuted, marginTop: spacing.sm }]}>Upapada (UL): {d.upapada.sign}</Text> : null}
    </>
  );
}

const makeStyles = (c: Colors) => StyleSheet.create({
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1, borderColor: c.borderCard, backgroundColor: c.bgCard },
  chipOn: { backgroundColor: c.accentPrimary, borderColor: c.accentPrimary },
  card: { backgroundColor: c.bgCard, borderColor: c.borderCard, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, marginHorizontal: spacing.lg, marginTop: spacing.sm },
  lbl: { color: c.textMuted, marginBottom: spacing.sm },
  yoga: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.borderCard },
  yogaHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pill: { borderRadius: radius.pill, paddingVertical: 3, paddingHorizontal: 8 },
  trow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  trhead: { borderBottomWidth: 1, borderBottomColor: c.borderCard, paddingBottom: 6, marginBottom: 2 },
  th: { color: c.textMuted },
  barBg: { height: 7, borderRadius: 4, backgroundColor: c.tagBg, marginTop: 5, overflow: 'hidden' },
  barFill: { height: 7, borderRadius: 4 },
  aspRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 6 },
});
