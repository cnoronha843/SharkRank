/**
 * SharkRank — Settings Screen
 * Configurações, sync status, e about.
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme';
import { getSyncQueueStats, processSyncQueue, clearSyncQueue } from '../services/sync';

export function SettingsScreen() {
  const [queueSize, setQueueSize] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadQueueSize();
  }, []);

  const loadQueueSize = async () => {
    const stats = await getSyncQueueStats();
    setQueueSize(stats.total);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await processSyncQueue();
      Alert.alert('Sync', `Processados: ${result.processed}, Falhas: ${result.failed}`);
      loadQueueSize();
    } catch (e) {
      Alert.alert('Erro', 'Falha na sincronização');
    } finally {
      setSyncing(false);
    }
  };

  const handleClearQueue = () => {
    Alert.alert('Limpar Fila', 'Remover todas as partidas pendentes?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Limpar', style: 'destructive', onPress: async () => { await clearSyncQueue(); loadQueueSize(); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} testID="sr_screen_settings">
      <Text style={styles.title}>⚙️ Configurações</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sincronização</Text>
        <View style={styles.item}>
          <Text style={styles.itemLabel}>Partidas na fila</Text>
          <Text style={[styles.itemValue, queueSize > 0 && { color: COLORS.warning }]}>{queueSize}</Text>
        </View>
        <TouchableOpacity style={styles.btn} onPress={handleSync} disabled={syncing}>
          <Text style={styles.btnText}>{syncing ? 'Sincronizando...' : '🔄 Sincronizar Agora'}</Text>
        </TouchableOpacity>
        {queueSize > 0 && (
          <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={handleClearQueue}>
            <Text style={[styles.btnText, { color: COLORS.error }]}>🗑️ Limpar Fila</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sobre</Text>
        <View style={styles.aboutCard}>
          <Text style={{ fontSize: 48, textAlign: 'center', marginBottom: 8 }}>🦈</Text>
          <Text style={styles.aboutName}>SharkRank v1.0.0</Text>
          <Text style={styles.aboutDesc}>Telemetria e Nivelamento ELO para Futevôlei</Text>
          <Text style={styles.aboutDesc}>Motor ELO Config: v1</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary, paddingHorizontal: SPACING.md },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginTop: SPACING.md, marginBottom: SPACING.lg },
  section: { marginBottom: SPACING.xl },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SPACING.md, textTransform: 'uppercase', letterSpacing: 0.5 },
  item: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: SPACING.md, backgroundColor: COLORS.bgCard, borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm,
  },
  itemLabel: { fontSize: 14, color: COLORS.textPrimary },
  itemValue: { fontSize: 16, fontWeight: '700', color: COLORS.accent },
  btn: {
    padding: SPACING.md, backgroundColor: COLORS.bgTertiary, borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', marginBottom: SPACING.sm,
  },
  btnDanger: { borderColor: 'rgba(255,82,82,0.2)' },
  btnText: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  aboutCard: {
    padding: SPACING.xl, backgroundColor: COLORS.bgCard, borderRadius: BORDER_RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center',
  },
  aboutName: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  aboutDesc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
});
