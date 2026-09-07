import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, Line, Text as T, G } from 'react-native-svg';
import { useColors } from '../../store/theme';
import { type } from '../../theme/typography';
import { spacing } from '../../theme/theme';

const ABBR: Record<string, string> = { Sun:'Su',Moon:'Mo',Mars:'Ma',Mercury:'Me',Jupiter:'Ju',Venus:'Ve',Saturn:'Sa',Rahu:'Ra',Ketu:'Ke' };
const SIGN3 = (s: string) => (s || '').slice(0, 3);

export default function SudarshanaChakra({ data, size = 320 }: { data: any; size?: number }) {
  const c = useColors();
  const S = size, cx = S / 2, cy = S / 2;
  const rings = [
    { key: 'lagna_chakra', label: 'Lagna', rOut: S * 0.48, rIn: S * 0.34 },
    { key: 'moon_chakra', label: 'Moon', rOut: S * 0.34, rIn: S * 0.20 },
    { key: 'sun_chakra', label: 'Sun', rOut: S * 0.20, rIn: S * 0.06 },
  ];
  // radial spokes every 30°, house 1 at top going clockwise
  const ang = (h: number) => (-90 + (h - 1) * 30) * (Math.PI / 180);
  const mid = (h: number) => ang(h) + (15 * Math.PI) / 180; // sector centre

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
        {[...rings.map((r) => r.rOut), rings[rings.length - 1].rIn].map((r, i) => (
          <Circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={c.borderStrong} strokeWidth={1} />
        ))}
        {Array.from({ length: 12 }).map((_, i) => {
          const a = ang(i + 1);
          return <Line key={i} x1={cx + Math.cos(a) * rings[2].rIn} y1={cy + Math.sin(a) * rings[2].rIn} x2={cx + Math.cos(a) * rings[0].rOut} y2={cy + Math.sin(a) * rings[0].rOut} stroke={c.borderCard} strokeWidth={0.75} />;
        })}
        {rings.map((ring) => {
          const wheel = data?.[ring.key]?.wheel || [];
          const rMid = (ring.rOut + ring.rIn) / 2;
          return (
            <G key={ring.key}>
              {wheel.map((h: any) => {
                const a = mid(h.house);
                const x = cx + Math.cos(a) * rMid;
                const y = cy + Math.sin(a) * rMid;
                const pls = (h.planets || []).map((p: string) => ABBR[p] || p.slice(0, 2)).join('');
                return (
                  <G key={h.house}>
                    {h.active ? <Circle cx={x} cy={y} r={ring === rings[2] ? 9 : 12} fill={c.accentBg} /> : null}
                    <T x={x} y={y - 3} fill={h.active ? c.accentPrimary : c.textMuted} fontSize={8.5} fontWeight="600" textAnchor="middle">{SIGN3(h.sign)}</T>
                    {pls ? <T x={x} y={y + 8} fill={c.accentPrimary} fontSize={9} fontWeight="700" textAnchor="middle">{pls}</T> : null}
                  </G>
                );
              })}
            </G>
          );
        })}
        <T x={cx} y={cy + 2} fill={c.textPrimary} fontSize={9} fontWeight="700" textAnchor="middle">Yr {data?.current_year_of_life ?? ''}</T>
      </Svg>
      <Text style={[type.caption, { color: c.textMuted, marginTop: spacing.sm, textAlign: 'center' }]}>
        Outer: Lagna · Mid: Moon · Inner: Sun — active house highlighted
      </Text>
    </View>
  );
}
