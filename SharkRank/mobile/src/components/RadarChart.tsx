import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polygon, Line, Circle, G, Text as SvgText } from 'react-native-svg';
import { COLORS } from '../theme';

interface RadarData {
  label: string;
  value: number; // 0 to 100
}

interface Props {
  data: RadarData[];
  size?: number;
}

export function RadarChart({ data, size = 200 }: Props) {
  const center = size / 2;
  const radius = (size / 2) * 0.7;
  const angleStep = (Math.PI * 2) / data.length;

  // Pontos do polígono de dados
  const points = data.map((item, i) => {
    const r = (item.value / 100) * radius;
    const x = center + r * Math.sin(i * angleStep);
    const y = center - r * Math.cos(i * angleStep);
    return `${x},${y}`;
  }).join(' ');

  // Linhas dos eixos e labels
  const axes = data.map((item, i) => {
    const x = center + radius * Math.sin(i * angleStep);
    const y = center - radius * Math.cos(i * angleStep);
    
    // Posição do texto um pouco mais afastada
    const tx = center + (radius + 25) * Math.sin(i * angleStep);
    const ty = center - (radius + 25) * Math.cos(i * angleStep);

    return (
      <G key={i}>
        <Line
          x1={center} y1={center}
          x2={x} y2={y}
          stroke={COLORS.border}
          strokeWidth="1"
        />
        <SvgText
          x={tx} y={ty}
          fill={COLORS.textSecondary}
          fontSize="10"
          fontWeight="bold"
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {item.label}
        </SvgText>
      </G>
    );
  });

  // Círculos concêntricos de guia
  const guides = [0.25, 0.5, 0.75, 1].map((p, i) => (
    <Circle
      key={i}
      cx={center} cy={center}
      r={radius * p}
      stroke={COLORS.border}
      strokeWidth="0.5"
      fill="none"
    />
  ));

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {guides}
        {axes}
        <Polygon
          points={points}
          fill={COLORS.accent + '30'}
          stroke={COLORS.accent}
          strokeWidth="2"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
});
