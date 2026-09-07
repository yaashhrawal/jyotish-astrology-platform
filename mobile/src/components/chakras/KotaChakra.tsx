import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Rect, Line, Text as T, G, Circle } from 'react-native-svg';
import { useColors } from '../../store/theme';
import { type } from '../../theme/typography';
import { spacing } from '../../theme/theme';

const ABBR: Record<string, string> = { Sun:'Su',Moon:'Mo',Mars:'Ma',Mercury:'Me',Jupiter:'Ju',Venus:'Ve',Saturn:'Sa',Rahu:'Ra',Ketu:'Ke' };
const ZONE_RING: Record<string, number> = { Stambha: 0, Madhya: 1, Prakara: 2, Bahya: 3, Bahi: 3 };

export default function KotaChakra({ data, size = 320 }: { data: any; size?: number }) {
  const c = useColors();
  const S = size, cx = S / 2, cy = S / 2;
  const half = [S * 0.10, S * 0.20, S * 0.32, S * 0.45]; // inner→outer half-widths
  const zones = ['Stambha', 'Madhya', 'Prakara', 'Bahya'];

  const planets = data?.planet_zones || [];
  // group by ring for angular spread
  const byRing: Record<number, any[]> = {};
  planets.forEach((p: any) => { const r = ZONE_RING[p.zone] ?? 2; (byRing[r] = byRing[r] || []).push(p); });

  const natureColor = (nat: string) => nat === 'protected' ? c.accentGreen : (nat === 'hostile' || nat === 'attacking') ? c.accentRed : c.textSecondary;

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
        {half.slice().reverse().map((h, i) => (
          <Rect key={i} x={cx - h} y={cy - h} width={h * 2} height={h * 2} fill="none" stroke={c.borderStrong} strokeWidth={i === 0 ? 1.5 : 1} rx={2} />
        ))}
        {/* diagonals of outer fort */}
        <Line x1={cx - half[3]} y1={cy - half[3]} x2={cx + half[3]} y2={cy + half[3]} stroke={c.borderCard} strokeWidth={0.75} />
        <Line x1={cx + half[3]} y1={cy - half[3]} x2={cx - half[3]} y2={cy + half[3]} stroke={c.borderCard} strokeWidth={0.75} />
        {/* zone labels */}
        {zones.map((z, i) => <T key={z} x={cx} y={cy - half[i] + 11} fill={c.textMuted} fontSize={7.5} fontWeight="600" textAnchor="middle">{z}</T>)}
        {/* planets placed on their ring, spread by angle */}
        {Object.entries(byRing).map(([ring, arr]) => {
          const rIdx = Number(ring);
          const rMid = rIdx === 0 ? 0 : (half[rIdx] + half[rIdx - 1]) / 2;
          return arr.map((p: any, i: number) => {
            const a = (-90 + (360 / arr.length) * i) * (Math.PI / 180);
            const x = rIdx === 0 ? cx : cx + Math.cos(a) * rMid;
            const y = rIdx === 0 ? cy : cy + Math.sin(a) * rMid;
            return (
              <G key={p.planet}>
                <Circle cx={x} cy={y} r={9} fill={c.bgCard} stroke={natureColor(p.nature)} strokeWidth={1.5} />
                <T x={x} y={y + 3} fill={natureColor(p.nature)} fontSize={9} fontWeight="700" textAnchor="middle">{ABBR[p.planet] || p.planet.slice(0, 2)}</T>
              </G>
            );
          });
        })}
      </Svg>
      <Text style={[type.caption, { color: c.textMuted, marginTop: spacing.sm, textAlign: 'center' }]}>
        Fortress on Moon nakṣatra {data?.natal_moon_nakshatra} · <Text style={{ color: c.accentGreen }}>protected</Text> / <Text style={{ color: c.accentRed }}>hostile</Text>
      </Text>
    </View>
  );
}
