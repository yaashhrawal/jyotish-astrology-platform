import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Rect, Line, Text as T, G, Circle } from 'react-native-svg';
import { useColors } from '../../store/theme';
import { type } from '../../theme/typography';
import { spacing } from '../../theme/theme';

const ABBR: Record<string, string> = { Sun:'Su',Moon:'Mo',Mars:'Ma',Mercury:'Me',Jupiter:'Ju',Venus:'Ve',Saturn:'Sa',Rahu:'Ra',Ketu:'Ke' };

export default function SBCChakra({ data, size = 320 }: { data: any; size?: number }) {
  const c = useColors();
  const S = size, n = 9, cell = S / n;
  const natal = data?.natal_planets || [];
  const transit = data?.transit_planets || [];

  const marker = (p: any, color: string, dy: number) => {
    if (p.sbc_row == null || p.sbc_col == null) return null;
    const x = p.sbc_col * cell + cell / 2;
    const y = p.sbc_row * cell + cell / 2 + dy;
    return <T key={`${p.type}-${p.planet}`} x={x} y={y} fill={color} fontSize={10} fontWeight="700" textAnchor="middle">{ABBR[p.planet] || p.planet.slice(0, 2)}</T>;
  };

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
        <Rect x={0} y={0} width={S} height={S} fill="none" stroke={c.borderStrong} strokeWidth={1.5} />
        {Array.from({ length: n - 1 }).map((_, i) => (
          <G key={i}>
            <Line x1={(i + 1) * cell} y1={0} x2={(i + 1) * cell} y2={S} stroke={c.borderCard} strokeWidth={0.75} />
            <Line x1={0} y1={(i + 1) * cell} x2={S} y2={(i + 1) * cell} stroke={c.borderCard} strokeWidth={0.75} />
          </G>
        ))}
        {/* centre brahma-sthana */}
        <Rect x={cell} y={cell} width={cell * 7} height={cell * 7} fill="none" stroke={c.borderStrong} strokeWidth={1} />
        {/* natal (saffron) above centre, transit (muted) below */}
        {natal.map((p: any) => marker(p, c.accentPrimary, -3))}
        {transit.map((p: any) => marker(p, c.textMuted, 10))}
      </Svg>
      <Text style={[type.caption, { color: c.textMuted, marginTop: spacing.sm, textAlign: 'center' }]}>
        9×9 SBC · Moon nakṣatra {data?.moon_nakshatra} — <Text style={{ color: c.accentPrimary }}>natal</Text> / <Text style={{ color: c.textMuted }}>transit</Text>
      </Text>
    </View>
  );
}
