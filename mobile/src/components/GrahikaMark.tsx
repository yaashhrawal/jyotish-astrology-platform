import React from 'react';
import Svg, { G, Path, Circle } from 'react-native-svg';

export default function GrahikaMark({ size = 28, color = '#1C1917' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <G stroke={color} strokeWidth={3.2} fill="none" strokeLinecap="round">
        <Path d="M50 16V9M16 50H9M50 84v7" />
      </G>
      <Circle cx={50} cy={50} r={30} fill="none" stroke={color} strokeWidth={3.2} strokeDasharray="154.5 34" />
      <Circle cx={75.3} cy={33.9} r={7} fill="#B4581F" />
    </Svg>
  );
}
