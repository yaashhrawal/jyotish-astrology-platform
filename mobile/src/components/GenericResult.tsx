import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useColors } from '../store/theme';
import { Colors, radius, spacing } from '../theme/theme';
import { type } from '../theme/typography';
import { useT } from '../i18n';

type TFn = (k: string) => string;

// Robust, defensive renderer for arbitrary calc-endpoint JSON.
// Objects → labelled key/value + nested sections. Arrays of objects → tables.

const SKIP = new Set(['longitude', 'lon', 'sign_index', 'speed', 'julian_day', 'pada', 'nakshatra_lord', 'degree_in_sign']);
const isObj = (v: any) => v && typeof v === 'object' && !Array.isArray(v);
const isPrim = (v: any) => v == null || typeof v !== 'object';
const titleRaw = (k: string) => k.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
const title = (k: string, t: TFn) => t(titleRaw(k));
const fmt = (v: any, t: TFn): string => {
  if (v == null) return '—';
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(2);
  if (typeof v === 'boolean') return t(v ? 'Yes' : 'No');
  if (Array.isArray(v)) return v.map((x) => fmt(x, t)).join(', ');
  if (isObj(v)) return t(v.name || v.label || v.sign || '—');
  return t(String(v));
};

function Table({ rows, c, s, t }: { rows: any[]; c: Colors; s: any; t: TFn }) {
  const cols = Array.from(new Set(rows.flatMap((r) => Object.keys(r)))).filter((k) => !SKIP.has(k)).slice(0, 5);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
        <View style={[s.tr, s.trh]}>
          {cols.map((col) => <Text key={col} style={[type.micro, s.th]}>{title(col, t).slice(0, 14)}</Text>)}
        </View>
        {rows.slice(0, 40).map((r, i) => (
          <View key={i} style={s.tr}>
            {cols.map((col) => <Text key={col} style={[type.caption, s.td]} numberOfLines={2}>{fmt(r[col], t)}</Text>)}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function Node({ value, depth, c, s, t }: { value: any; depth: number; c: Colors; s: any; t: TFn }) {
  if (isPrim(value)) return <Text style={[type.body, { color: c.textSecondary }]}>{fmt(value, t)}</Text>;

  if (Array.isArray(value)) {
    if (!value.length) return <Text style={[type.body, { color: c.textMuted }]}>{t('None')}</Text>;
    if (value.every(isPrim)) return <Text style={[type.body, { color: c.textSecondary }]}>{value.map((x) => fmt(x, t)).join(' · ')}</Text>;
    return <Table rows={value.filter(isObj)} c={c} s={s} t={t} />;
  }

  const entries = Object.entries(value).filter(([k]) => !SKIP.has(k));
  const prims = entries.filter(([, v]) => isPrim(v));
  const complex = entries.filter(([, v]) => !isPrim(v));

  return (
    <View>
      {prims.length > 0 && (
        <View style={{ marginBottom: complex.length ? spacing.sm : 0 }}>
          {prims.map(([k, v]) => (
            <View key={k} style={s.kv}>
              <Text style={[type.caption, { color: c.textMuted, width: 130 }]}>{title(k, t)}</Text>
              <Text style={[type.body, { color: c.textPrimary, flex: 1 }]}>{fmt(v, t)}</Text>
            </View>
          ))}
        </View>
      )}
      {complex.map(([k, v]) => (
        <View key={k} style={{ marginTop: spacing.sm }}>
          <Text style={[type.micro, { color: c.accentPrimary, marginBottom: 4 }]}>{title(k, t).toUpperCase()}</Text>
          {depth < 3 ? <Node value={v} depth={depth + 1} c={c} s={s} t={t} /> : <Text style={[type.caption, { color: c.textMuted }]}>{fmt(v, t)}</Text>}
        </View>
      ))}
    </View>
  );
}

export default function GenericResult({ data }: { data: any }) {
  const c = useColors();
  const { t } = useT();
  const s = makeStyles(c);
  if (!data) return null;
  return <Node value={data} depth={0} c={c} s={s} t={t} />;
}

const makeStyles = (c: Colors) => StyleSheet.create({
  kv: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 5, gap: 8 },
  tr: { flexDirection: 'row', paddingVertical: 5 },
  trh: { borderBottomWidth: 1, borderBottomColor: c.borderCard, marginBottom: 2 },
  th: { color: c.textMuted, width: 96, paddingRight: 8 },
  td: { color: c.textSecondary, width: 96, paddingRight: 8 },
});
