/**
 * SharkRank — Paywall Screen
 * Tela de upsell do RevenueCat.
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PurchasesPackage } from 'react-native-purchases';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme';
import { getOfferings, purchasePackage } from '../services/revenueCat';

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

export function PaywallScreen({ onSuccess, onCancel }: Props) {
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    async function load() {
      const pkgs = await getOfferings();
      setPackages(pkgs);
      setLoading(false);
    }
    load();
  }, []);

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setPurchasing(true);
    const customerInfo = await purchasePackage(pkg);
    setPurchasing(false);

    if (customerInfo?.entitlements.active['premium_arena']) {
      Alert.alert("Sucesso!", "Sua arena agora é Premium. O Ranking está liberado!");
      onSuccess();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.emoji}>🚀</Text>
        <Text style={styles.title}>Desbloqueie o SharkRank Premium</Text>
        <Text style={styles.subtitle}>
          Saia do Shadow Mode e libere o Ranking Oficial e as estatísticas detalhadas para seus alunos.
        </Text>

        <View style={styles.features}>
          <Text style={styles.featureItem}>✅ Ranking Global e por Arena liberados</Text>
          <Text style={styles.featureItem}>✅ Dashboard Avançado de Atletas</Text>
          <Text style={styles.featureItem}>✅ Remoção da trava de alunos (Ilimitado)</Text>
          <Text style={styles.featureItem}>✅ Acesso Prioritário a Novas Features</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.packagesContainer}>
            {packages.map(pkg => (
              <TouchableOpacity
                key={pkg.identifier}
                style={styles.packageBtn}
                onPress={() => handlePurchase(pkg)}
                disabled={purchasing}
              >
                <View>
                  <Text style={styles.packageTitle}>{pkg.product.title}</Text>
                  <Text style={styles.packageDesc}>{pkg.product.description}</Text>
                </View>
                <Text style={styles.packagePrice}>{pkg.product.priceString}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  closeBtn: { padding: SPACING.lg, alignSelf: 'flex-start' },
  closeText: { fontSize: 24, color: COLORS.textMuted },
  content: { flex: 1, paddingHorizontal: SPACING.xl, justifyContent: 'center' },
  emoji: { fontSize: 64, textAlign: 'center', marginBottom: SPACING.md },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center', marginBottom: SPACING.sm },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.xl, lineHeight: 20 },
  features: { backgroundColor: COLORS.bgCard, padding: SPACING.lg, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.xl },
  featureItem: { fontSize: 14, color: COLORS.textPrimary, marginBottom: 12, fontWeight: '500' },
  packagesContainer: { gap: SPACING.md },
  packageBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.accent, padding: SPACING.lg, borderRadius: BORDER_RADIUS.sm,
  },
  packageTitle: { fontSize: 16, fontWeight: '700', color: COLORS.bgPrimary },
  packageDesc: { fontSize: 12, color: 'rgba(6, 11, 24, 0.7)', marginTop: 2 },
  packagePrice: { fontSize: 20, fontWeight: '800', color: COLORS.bgPrimary },
});
