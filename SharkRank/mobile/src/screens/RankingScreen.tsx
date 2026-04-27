/**
 * SharkRank — Ranking Screen
 * Decisão #3: Em SHADOW_MODE, mostra placeholder em vez do ranking real.
 */

import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, BORDER_RADIUS, getTier } from '../theme';
import { api } from '../services/api';
import { getFlag } from '../services/flags';
import { PaywallScreen } from './PaywallScreen';
import { checkPremiumStatus, setupRevenueCat } from '../services/revenueCat';
import { RadarChart } from '../components/RadarChart';
import { MatchTimeline } from '../components/MatchTimeline';
import { ShareCard } from '../components/ShareCard';
import { ScrollView } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

interface Player {
  id: string;
  name: string;
  rating: number;
  matches_played: number;
  wins: number;
  points: number;
  errors: number;
}

export function RankingScreen() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [isShadow, setIsShadow] = useState(getFlag('SHADOW_MODE'));
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [playerStats, setPlayerStats] = useState<any>(null);
  const [playerMatches, setPlayerMatches] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [sharing, setSharing] = useState(false);
  
  const shareCardRef = useRef<View>(null);

  useEffect(() => {
    async function init() {
      await setupRevenueCat('arena-blumenau-01');
      const isPremium = await checkPremiumStatus();
      if (isPremium) {
        setIsShadow(false);
      }
      
      if (!isShadow && !isPremium) loadRanking();
      else setLoading(false);
    }
    init();
  }, [isShadow]);

  useEffect(() => {
    if (selectedPlayer) {
      loadPlayerData(selectedPlayer.id);
    } else {
      setPlayerStats(null);
      setPlayerMatches([]);
    }
  }, [selectedPlayer]);

  const loadRanking = async () => {
    try {
      const data = await api.getArenaRanking('arena-blumenau-01');
      
      // LÓGICA DE RANKING SHARKRANK V2
      // 1. Vitórias (DESC)
      // 2. Pontos (DESC)
      // 3. Menos Erros (ASC)
      const sortedRanking = [...data.ranking].sort((a, b) => {
        if ((b.wins || 0) !== (a.wins || 0)) return (b.wins || 0) - (a.wins || 0);
        if ((b.points || 0) !== (a.points || 0)) return (b.points || 0) - (a.points || 0);
        return (a.errors || 0) - (b.errors || 0);
      });

      setPlayers(sortedRanking);
    } catch {} finally {
      setLoading(false);
    }
  };

  const loadPlayerData = async (pid: string) => {
    setLoadingStats(true);
    try {
      const [statsData, matchesData] = await Promise.all([
        api.getPlayerStats(pid),
        api.getPlayerMatches(pid),
      ]);
      setPlayerStats(statsData.stats);
      setPlayerMatches(matchesData.matches);
    } catch (e) {
      console.error("Error loading player data", e);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const uri = await captureRef(shareCardRef, {
        format: 'png',
        quality: 0.9,
      });
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Compartilhar meu Ranking',
        UTI: 'public.png',
      });
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível gerar a imagem de compartilhamento.');
    } finally {
      setSharing(false);
    }
  };

  // === SHADOW MODE: Placeholder ===
  if (isShadow) {
    if (showPaywall) {
      return (
        <PaywallScreen 
          onSuccess={() => { setShowPaywall(false); setIsShadow(false); }}
          onCancel={() => setShowPaywall(false)}
        />
      );
    }

    return (
      <SafeAreaView style={styles.container} testID="sr_screen_ranking">
        <View style={styles.shadowContainer}>
          <Text style={styles.shadowEmoji}>🔭</Text>
          <Text style={styles.shadowTitle}>Ranking em Calibração</Text>
          <Text style={styles.shadowDesc}>
            Estamos coletando dados para calibrar o motor de nivelamento ELO.
            O ranking será liberado em breve!
          </Text>
          <View style={styles.shadowProgress}>
            <View style={styles.shadowBar}>
              <View style={[styles.shadowBarFill, { width: '45%' }]} />
            </View>
            <Text style={styles.shadowBarLabel}>~45% das partidas necessárias coletadas</Text>
          </View>
          <View style={styles.shadowInfoCard}>
            <Text style={styles.shadowInfoTitle}>💡 O que está acontecendo?</Text>
            <Text style={styles.shadowInfoText}>
              Cada partida que você registra alimenta nosso algoritmo. Após 30 partidas 
              por arena, cruzaremos os dados com sua avaliação para garantir precisão máxima.
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.unlockBtn} 
            onPress={() => setShowPaywall(true)}
          >
            <Text style={styles.unlockBtnText}>🚀 Desbloquear Ranking Oficial</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // === MODO NORMAL: Ranking visível ===
  return (
    <SafeAreaView style={styles.container} testID="sr_screen_ranking">
      <Text style={styles.title}>🏆 Ranking da Arena</Text>

      {loading ? (
        <ActivityIndicator color={COLORS.accent} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={players}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item, index }) => {
            const tier = getTier(item.rating);
            const isTop3 = index < 3;
            return (
              <TouchableOpacity activeOpacity={0.7} onPress={() => setSelectedPlayer(item)}>
                <View style={[styles.rankCard, isTop3 && { borderColor: tier.color + '40' }]}>
                  <View style={[styles.pos, isTop3 && { backgroundColor: tier.color }]}>
                    <Text style={[styles.posText, isTop3 && { color: COLORS.bgPrimary }]}>
                      {index + 1}
                    </Text>
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.name}>{item.name}</Text>
                    <View style={styles.statsRow}>
                      <Text style={styles.statMini}>🥇 {item.wins || 0}V</Text>
                      <Text style={styles.statMini}>☄️ {item.points || 0}P</Text>
                      <Text style={[styles.statMini, {color: COLORS.error}]}>🚫 {item.errors || 0}E</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Modal de Perfil de Jogador */}
      <Modal visible={!!selectedPlayer} transparent animationType="slide">
        {selectedPlayer && (() => {
          const tier = getTier(selectedPlayer.rating);
          const wins = playerStats?.wins || 0;
          const losses = playerStats?.losses || 0;
          const total = wins + losses;
          const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

          // Dados fake para o radar caso ainda não tenha muitos fundamentos marcados
          const radarData = [
            { label: 'Ataque', value: playerStats?.fundamentals?.shark_ataque ? Math.min(playerStats.fundamentals.shark_ataque * 10, 100) : 45 },
            { label: 'Defesa', value: playerStats?.fundamentals?.coxa ? Math.min(playerStats.fundamentals.coxa * 8, 100) : 60 },
            { label: 'Recepção', value: playerStats?.fundamentals?.peito ? Math.min(playerStats.fundamentals.peito * 12, 100) : 55 },
            { label: 'Precisão', value: 75 },
            { label: 'Vigor', value: Math.min(selectedPlayer.matches_played * 5, 100) },
          ];

          return (
            <View style={styles.modalBg}>
              <View style={styles.modalContent}>
                <ScrollView 
                  style={{ width: '100%' }} 
                  contentContainerStyle={{ alignItems: 'center' }}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalEmoji}>{tier.emoji}</Text>
                    <Text style={styles.modalPlayerName}>{selectedPlayer.name}</Text>
                    <Text style={[styles.modalTierName, {color: tier.color}]}>{tier.name} ({selectedPlayer.rating} ELO)</Text>
                  </View>

                  {loadingStats ? (
                    <ActivityIndicator color={COLORS.accent} style={{ margin: 40 }} />
                  ) : (
                    <>
                      <RadarChart data={radarData} size={180} />

                      <View style={styles.statsGrid}>
                        <View style={styles.statBox}>
                          <Text style={styles.statValue}>{selectedPlayer.matches_played}</Text>
                          <Text style={styles.statLabel}>Partidas</Text>
                        </View>
                        <View style={styles.statBox}>
                          <Text style={[styles.statValue, {color: COLORS.success}]}>{winRate}%</Text>
                          <Text style={styles.statLabel}>Win Rate</Text>
                        </View>
                      </View>

                      <View style={styles.wltRow}>
                        <Text style={{color: COLORS.success, fontWeight: 'bold'}}>V: {wins}</Text>
                        <Text style={{color: COLORS.textMuted}}> | </Text>
                        <Text style={{color: COLORS.error, fontWeight: 'bold'}}>D: {losses}</Text>
                      </View>

                      <MatchTimeline matches={playerMatches} playerId={selectedPlayer.id} />
                    </>
                  )}

                  <TouchableOpacity 
                    style={[styles.shareBtn, sharing && { opacity: 0.5 }]} 
                    onPress={handleShare}
                    disabled={sharing || loadingStats}
                  >
                    <Text style={styles.shareBtnText}>
                      {sharing ? 'Gerando imagem...' : '📸 Compartilhar no Story'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedPlayer(null)}>
                    <Text style={styles.closeBtnText}>Fechar Perfil</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>

              {/* ShareCard escondido para captura */}
              <View style={{ position: 'absolute', left: -1000, top: 0 }}>
                <View ref={shareCardRef} collapsable={false}>
                  <ShareCard 
                    player={selectedPlayer} 
                    stats={playerStats} 
                    radarData={radarData}
                    arenaName="Arena Praia do Moura"
                  />
                </View>
              </View>
            </View>
          );
        })()}
      </Modal>


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary, paddingHorizontal: SPACING.md },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginVertical: SPACING.lg },

  // Ranking cards
  rankCard: {
    flexDirection: 'row', alignItems: 'center', padding: SPACING.md,
    backgroundColor: COLORS.bgCard, borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border,
  },
  pos: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.bgTertiary, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
  posText: { color: COLORS.textSecondary, fontWeight: 'bold' },
  info: { flex: 1 },
  name: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  statMini: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '800' },
  rating: { fontSize: 18, fontWeight: '900' },

  // Shadow Mode UI
  shadowContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  shadowEmoji: { fontSize: 64, marginBottom: SPACING.md },
  shadowTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.sm, textAlign: 'center' },
  shadowDesc: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.xl, lineHeight: 20 },
  shadowProgress: { width: '100%', marginBottom: SPACING.xl },
  shadowBar: { height: 8, backgroundColor: COLORS.bgTertiary, borderRadius: 4, overflow: 'hidden', marginBottom: SPACING.sm },
  shadowBarFill: { height: '100%', backgroundColor: COLORS.accent },
  shadowBarLabel: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center' },
  shadowInfoCard: { backgroundColor: COLORS.bgTertiary, padding: SPACING.md, borderRadius: BORDER_RADIUS.sm, marginBottom: SPACING.xl, width: '100%' },
  shadowInfoTitle: { color: COLORS.textPrimary, fontWeight: '700', marginBottom: SPACING.xs },
  shadowInfoText: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 18 },
  unlockBtn: { backgroundColor: COLORS.accent, padding: SPACING.md, borderRadius: BORDER_RADIUS.md, width: '100%', alignItems: 'center' },
  unlockBtnText: { color: COLORS.bgPrimary, fontWeight: '800', fontSize: 16 },

  // Modal
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: COLORS.bgSecondary, padding: 30, borderRadius: BORDER_RADIUS.md, width: '100%', alignItems: 'center' },
  modalHeader: { alignItems: 'center', marginBottom: 20 },
  modalEmoji: { fontSize: 48, marginBottom: 10 },
  modalPlayerName: { color: COLORS.textPrimary, fontSize: 24, fontWeight: 'bold' },
  modalTierName: { fontSize: 14, fontWeight: '600', marginTop: 5 },
  statsGrid: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginBottom: 20 },
  statBox: { backgroundColor: COLORS.bgTertiary, flex: 1, marginHorizontal: 5, padding: 15, borderRadius: BORDER_RADIUS.sm, alignItems: 'center' },
  statValue: { color: COLORS.textPrimary, fontSize: 24, fontWeight: 'bold' },
  statLabel: { color: COLORS.textSecondary, fontSize: 12, marginTop: 5 },
  wltRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, gap: 10 },
  closeBtn: { backgroundColor: COLORS.bgTertiary, padding: 15, borderRadius: BORDER_RADIUS.sm, width: '100%', alignItems: 'center' },
  closeBtnText: { color: COLORS.textPrimary, fontWeight: 'bold' },
  shareBtn: { 
    backgroundColor: COLORS.accentOrange, 
    padding: 15, 
    borderRadius: BORDER_RADIUS.sm, 
    width: '100%', 
    alignItems: 'center',
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
  },
  shareBtnText: { color: COLORS.textPrimary, fontWeight: '900', fontSize: 14 },
});

