/**
 * SharkRank — Botão de Fundamento (Fat-Finger)
 * Decisão #2: minHeight 72dp, testID padronizado sr_btn_{fundamento}.
 * Contraste WCAG AAA para uso sob sol direto.
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, FAT_FINGER, BORDER_RADIUS } from '../theme';

interface FundamentoButtonProps {
  emoji: string;
  label: string;
  testID: string;
  onPress: () => void;
  count?: number;
  isNegative?: boolean;
}

export function FundamentoButton({ emoji, label, testID, onPress, count = 0, isNegative = false }: FundamentoButtonProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <TouchableOpacity
      testID={testID}
      accessibilityLabel={`Marcar ${label}`}
      accessibilityRole="button"
      style={[styles.button, isNegative && styles.buttonNegative]}
      activeOpacity={0.7}
      onPress={handlePress}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.label}>{label}</Text>
      {count > 0 && (
        <View style={[styles.badge, isNegative && styles.badgeNegative]}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: FAT_FINGER.minHeight,
    flex: 1,
    backgroundColor: COLORS.bgTertiary,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    position: 'relative',
  },
  buttonNegative: {
    borderColor: 'rgba(255, 82, 82, 0.2)',
    backgroundColor: 'rgba(255, 82, 82, 0.08)',
  },
  emoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.full,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeNegative: {
    backgroundColor: COLORS.error,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.bgPrimary,
  },
});
