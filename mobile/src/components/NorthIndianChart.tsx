import React from 'react';
import { View } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, G } from 'react-native-svg';
import { useColors } from '../store/theme';
import { useLangStore } from '../i18n';

const ABBR: Record<string, string> = {
  Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me', Jupiter: 'Ju',
  Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke',
};
const ABBR_HI: Record<string, string> = {
  Sun: 'सू', Moon: 'चं', Mars: 'मं', Mercury: 'बु', Jupiter: 'गु',
  Venus: 'शु', Saturn: 'श', Rahu: 'रा', Ketu: 'के',
};

// House label anchor points (fraction of S), North-Indian fixed layout.
const HOUSE_POS: [number, number][] = [
  [0.50, 0.24], // 1 top-center diamond
  [0.25, 0.11], // 2
  [0.12, 0.25], // 3
  [0.25, 0.50], // 4 left diamond
  [0.12, 0.75], // 5
  [0.25, 0.89], // 6
  [0.50, 0.76], // 7 bottom diamond
  [0.75, 0.89], // 8
  [0.88, 0.75], // 9
  [0.75, 0.50], // 10 right diamond
  [0.88, 0.25], // 11
  [0.75, 0.11], // 12
];

interface Props {
  size?: number;
  ascSignIndex: number;                    // 0..11
  planetHouseMap: Record<string, string[]>; // house "1".."12" -> [planet names]
  planets: Record<string, { retrograde?: boolean }>;
}

export default function NorthIndianChart({ size = 300, ascSignIndex, planetHouseMap, planets }: Props) {
  const c = useColors();
  const hi = useLangStore((s) => s.lang) === 'hi';
  const AB = hi ? ABBR_HI : ABBR;
  const S = size;
  const m = S / 2;

  // planet_house_map is keyed by house number → list of planet names.
  const byHouse: Record<number, string[]> = {};
  Object.entries(planetHouseMap || {}).forEach(([house, names]) => {
    const h = parseInt(house, 10);
    byHouse[h] = (names || []).map((name) => (AB[name] || name.slice(0, 2)) + (planets?.[name]?.retrograde ? '↺' : ''));
  });

  return (
    <View>
      <Svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
        <Rect x={0} y={0} width={S} height={S} fill="none" stroke={c.borderStrong} strokeWidth={1.5} />
        {/* diagonals */}
        <Line x1={0} y1={0} x2={S} y2={S} stroke={c.borderCard} strokeWidth={1} />
        <Line x1={S} y1={0} x2={0} y2={S} stroke={c.borderCard} strokeWidth={1} />
        {/* diamond */}
        <Line x1={m} y1={0} x2={S} y2={m} stroke={c.borderCard} strokeWidth={1} />
        <Line x1={S} y1={m} x2={m} y2={S} stroke={c.borderCard} strokeWidth={1} />
        <Line x1={m} y1={S} x2={0} y2={m} stroke={c.borderCard} strokeWidth={1} />
        <Line x1={0} y1={m} x2={m} y2={0} stroke={c.borderCard} strokeWidth={1} />

        {HOUSE_POS.map(([fx, fy], idx) => {
          const houseNum = idx + 1;
          const rashi = ((ascSignIndex + idx) % 12) + 1;
          const x = fx * S;
          const y = fy * S;
          const occ = byHouse[houseNum] || [];
          return (
            <G key={houseNum}>
              {/* rashi number */}
              <SvgText x={x} y={y - 8} fill={c.textMuted} fontSize={10} fontWeight="600" textAnchor="middle">
                {rashi}
              </SvgText>
              {/* planets */}
              {occ.map((p, i) => (
                <SvgText
                  key={i}
                  x={x}
                  y={y + 8 + i * 13}
                  fill={c.accentPrimary}
                  fontSize={11}
                  fontWeight="700"
                  textAnchor="middle"
                >
                  {p}
                </SvgText>
              ))}
            </G>
          );
        })}
      </Svg>
    </View>
  );
}
