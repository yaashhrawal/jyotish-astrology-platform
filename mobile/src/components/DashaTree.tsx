import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../store/theme';
import { radius, spacing } from '../theme/theme';
import { type } from '../theme/typography';
import { DashaNode } from '../api/astro';
import { useT } from '../i18n';

const now = Date.now();
const isActive = (d: DashaNode) => {
  const s = Date.parse(d.start.replace(' ', 'T'));
  const e = Date.parse(d.end.replace(' ', 'T'));
  return s <= now && now < e;
};
const children = (d: DashaNode) => d.antardashas || d.pratyantardashas || [];

function Row({ node, depth }: { node: DashaNode; depth: number }) {
  const c = useColors();
  const { t } = useT();
  const kids = children(node);
  const active = isActive(node);
  const [open, setOpen] = useState(active && depth < 2);

  return (
    <View>
      <Pressable
        onPress={() => kids.length && setOpen((o) => !o)}
        style={[
          styles.row,
          { paddingLeft: spacing.md + depth * 16 },
          active && { backgroundColor: c.accentBg, borderRadius: radius.sm },
        ]}
      >
        {kids.length ? (
          <Ionicons name={open ? 'chevron-down' : 'chevron-forward'} size={13} color={c.textMuted} style={{ width: 16 }} />
        ) : (
          <View style={{ width: 16 }} />
        )}
        <Text style={[depth === 0 ? type.bodyMed : type.body, { color: active ? c.accentPrimary : c.textPrimary, width: 74 }]}>
          {t(node.lord)}{active ? ' •' : ''}
        </Text>
        <Text style={[type.caption, { color: c.textMuted, flex: 1 }]}>
          {node.start.slice(0, 10)} → {node.end.slice(0, 10)}
        </Text>
        <Text style={[type.caption, { color: c.textMuted }]}>
          {node.years >= 1 ? `${node.years.toFixed(1)}y` : `${Math.round(node.years * 365)}d`}
        </Text>
      </Pressable>
      {open && kids.map((k, i) => <Row key={`${k.lord}-${i}`} node={k} depth={depth + 1} />)}
    </View>
  );
}

export default function DashaTree({ dashas }: { dashas: DashaNode[] }) {
  return (
    <View>
      {dashas.map((d, i) => <Row key={`${d.lord}-${i}`} node={d} depth={0} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingRight: spacing.sm, gap: 4 },
});
