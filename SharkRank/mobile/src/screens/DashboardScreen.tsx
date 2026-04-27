/**
 * SharkRank — Dashboard Screen
 * Visão geral: stats, top atleta, ranking rápido.
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, BORDER_RADIUS, getTier } from '../theme';
import { api } from '../services/api';
import { getFlag } from '../services/flags';
import { GroupsModal } from './GroupsScreen';

interface Player {
  id: string;
  name: string;
  rating: number;
  matches_played: number;
  wins: number;
}

export function DashboardScreen() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [calibrationReport, setCalibrationReport] = useState<any>(null);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [showGroupsModal, setShowGroupsModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const arenaId = 'arena-blumenau-01';
      const [rankingData, reportData, matchesData] = await Promise.all([
        api.getArenaRanking(arenaId),
        getFlag('SHADOW_MODE') ? api.getCalibrationReport(arenaId) : Promise.resolve(null),
        api.getArenaMatches(arenaId),
      ]);
      
      // Ordenar por vitórias para pegar o Top Atleta real
      const sorted = [...rankingData.ranking].sort((a, b) => (b.wins || 0) - (a.wins || 0));
      setPlayers(sorted);
      setRecentMatches(matchesData?.matches || []);
      
      if (reportData) setCalibrationReport(reportData);
    } catch (e) {
      // Offline
    } finally {
      setLoading(false);
    }
  };

  const top = players[0];
  const topTier = top ? getTier(top.rating) : null;

  return (
    <SafeAreaView style={styles.container} testID="sr_screen_dashboard">
      <GroupsModal visible={showGroupsModal} onClose={() => setShowGroupsModal(false)} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={styles.greeting}>Olá! 👋</Text>
        <Text style={styles.subtitle}>Painel de telemetria SharkRank</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{players.length}</Text>
            <Text style={styles.statLabel}>ATLETAS</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {players.reduce((s, p) => s + (p.wins || 0), 0)}
            </Text>
            <Text style={styles.statLabel}>VITÓRIAS TOTAIS</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {players.reduce((s, p) => s + p.matches_played, 0)}
            </Text>
            <Text style={styles.statLabel}>PARTIDAS</Text>
          </View>
        </View>

        {/* Top Athlete */}
        {top && topTier && (
          <View style={styles.topCard}>
            <Text style={styles.topEmoji}>{topTier.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.topName}>{top.name}</Text>
              <Text style={[styles.topTier, { color: topTier.color }]}>{topTier.name} · {top.wins || 0} Vitórias</Text>
            </View>
            <Text style={styles.topRating}>#1</Text>
          </View>
        )}

        {/* Shadow Mode - Painel do Professor */}
        {getFlag('SHADOW_MODE') && calibrationReport && (
          <View style={styles.calibrationCard}>
            <Text style={styles.calibrationTitle}>🔬 Status da Calibração (Beta)</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <View>
                <Text style={styles.calibrationLabel}>Precisão</Text>
                <Text style={styles.calibrationValue}>{calibrationReport.avg_accuracy_score} / 5.0</Text>
              </View>
              <View>
                <Text style={styles.calibrationLabel}>Adoção</Text>
                <Text style={styles.calibrationValue}>{calibrationReport.would_use_pct}%</Text>
              </View>
              <View>
                <Text style={styles.calibrationLabel}>Gate Status</Text>
                <Text style={[styles.calibrationValue, { color: calibrationReport.gate_status === 'APPROVED' ? COLORS.success : COLORS.warning }]}>
                  {calibrationReport.gate_status}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Ações Rápidas</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionCard} onPress={() => {}}>
            <Text style={{ fontSize: 28 }}>⚡</Text>
            <Text style={styles.actionText}>Nova Partida</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => {}}>
            <Text style={{ fontSize: 28 }}>👥</Text>
            <Text style={styles.actionText}>Novo Atleta</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => setShowGroupsModal(true)}>
            <Text style={{ fontSize: 28 }}>🏘️</Text>
            <Text style={styles.actionText}>Meus Grupos</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Matches (Reais) */}
        <Text style={styles.sectionTitle}>Últimas Partidas</Text>
        {recentMatches.length === 0 ? (
          <View style={[styles.recentMatchCard, { borderStyle: 'dashed', borderColor: COLORS.textMuted }]}>
            <Text style={{ color: COLORS.textMuted, textAlign: 'center' }}>Nenhuma partida registrada hoje.</Text>
          </View>
        ) : (
          recentMatches.slice(0, 3).map((match, idx) => (
            <View key={idx} style={[styles.recentMatchCard, { marginBottom: 10 }]}>
              <View style={styles.matchHeader}>
                <Text style={[styles.matchStatus, { color: COLORS.success }]}>Finalizada</Text>
                <Text style={styles.matchTime}>{new Date(match.date).toLocaleDateString('pt-BR')}</Text>
              </View>
              <View style={styles.matchScoreboard}>
                <View style={styles.teamInfo}>
                  <Text style={styles.teamName}>{match.teamA_name}</Text>
                  <Text style={styles.teamScore}>{match.scoreA}</Text>
                </View>
                <Text style={styles.vs}>X</Text>
                <View style={styles.teamInfo}>
                  <Text style={styles.teamScore}>{match.scoreB}</Text>
                  <Text style={styles.teamName}>{match.teamB_name}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary, paddingHorizontal: SPACING.md },
  greeting: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginTop: SPACING.md },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  statCard: {
    flex: 1, backgroundColor: COLORS.bgCard, borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, alignItems: 'center',
  },
  statValue: { fontSize: 22, fontWeight: '800', color: COLORS.accent },
  statLabel: { fontSize: 9, fontWeight: '600', color: COLORS.textSecondary, marginTop: 4, letterSpacing: 0.5 },
  topCard: {
    flexDirection: 'row', alignItems: 'center', padding: SPACING.md,
    backgroundColor: COLORS.bgCard, borderRadius: BORDER_RADIUS.md,
    borderWidth: 1, borderColor: COLORS.borderActive, marginBottom: SPACING.lg,
  },
  topEmoji: { fontSize: 36, marginRight: SPACING.md },
  topName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  topTier: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  topRating: { fontSize: 28, fontWeight: '800', color: COLORS.accent },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm, marginTop: SPACING.md },
  actionsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  actionCard: {
    flex: 1, backgroundColor: COLORS.bgCard, borderRadius: 16, padding: SPACING.md,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  actionText: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary, marginTop: 8 },
  recentMatchCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 16, padding: SPACING.md,
    borderWidth: 1, borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  matchHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  matchStatus: { fontSize: 12, fontWeight: '800', color: '#FF3B30' }, // Red for live
  matchTime: { fontSize: 12, color: COLORS.textMuted },
  matchScoreboard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  teamInfo: { flex: 1, alignItems: 'center' },
  teamName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 4 },
  teamScore: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary },
  vs: { fontSize: 16, fontWeight: '800', color: COLORS.textMuted, marginHorizontal: 16 },
  calibrationCard: {
    backgroundColor: 'rgba(0, 212, 255, 0.05)', borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1, borderColor: COLORS.accent, padding: SPACING.md, marginBottom: SPACING.lg,
  },
  calibrationTitle: { fontSize: 14, fontWeight: '700', color: COLORS.accent },
  calibrationLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 8 },
  calibrationValue: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
});
