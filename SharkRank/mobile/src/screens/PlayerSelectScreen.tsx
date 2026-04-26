/**
 * SharkRank — Tela de Seleção de Jogadores
 * Sprint 3: Selecionar 4 atletas (2 por time) antes de iniciar a partida.
 * Busca jogadores da API ou cache local.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, FlatList, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, BORDER_RADIUS, getTier } from '../theme';
import { api } from '../services/api';

interface Player {
  id: string;
  name: string;
  rating: number;
  matches_played: number;
}

interface SelectedTeams {
  teamA: Player[];
  teamB: Player[];
}

interface Props {
  arenaId: string;
  onTeamsSelected: (teams: SelectedTeams) => void;
  onCancel: () => void;
}

export function PlayerSelectScreen({ arenaId, onTeamsSelected, onCancel }: Props) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [step, setStep] = useState<'teamA' | 'teamB'>('teamA');
  const [teamA, setTeamA] = useState<Player[]>([]);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      const data = await api.getArenaPlayers(arenaId);
      setPlayers(data.players);
    } catch {
      // Demo fallback
      setPlayers([
        { id: 'p-rafael', name: "Rafael 'Tubarão' Silva", rating: 1620, matches_played: 32 },
        { id: 'p-lucas', name: "Lucas 'Foguete' Santos", rating: 1580, matches_played: 25 },
        { id: 'p-mateus', name: "Mateus 'Trovão' Almeida", rating: 1555, matches_played: 28 },
        { id: 'p-pedro', name: "Pedro 'Pantera' Oliveira", rating: 1520, matches_played: 18 },
        { id: 'p-gabriel', name: "Gabriel 'Serpente' Lima", rating: 1510, matches_played: 15 },
        { id: 'p-thiago', name: "Thiago 'Flash' Costa", rating: 1470, matches_played: 10 },
        { id: 'p-andre', name: "André 'Máquina' Rocha", rating: 1445, matches_played: 8 },
        { id: 'p-bruno', name: "Bruno 'Águia' Ferreira", rating: 1410, matches_played: 4 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const togglePlayer = (player: Player) => {
    if (selected.includes(player.id)) {
      setSelected(selected.filter(id => id !== player.id));
    } else if (selected.length < 2) {
      setSelected([...selected, player.id]);
    }
  };

  const confirmTeam = () => {
    const selectedPlayers = players.filter(p => selected.includes(p.id));
    if (step === 'teamA') {
      setTeamA(selectedPlayers);
      setStep('teamB');
      setSelected([]);
    } else {
      onTeamsSelected({ teamA, teamB: selectedPlayers });
    }
  };

  const availablePlayers = step === 'teamB'
    ? players.filter(p => !teamA.find(t => t.id === p.id))
    : players;

  return (
    <SafeAreaView style={styles.container} testID="sr_screen_player_select">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel}>
          <Text style={styles.cancelText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {step === 'teamA' ? '🔵 Selecione o Time A' : '🔴 Selecione o Time B'}
        </Text>
        <Text style={styles.subtitle}>Escolha 2 jogadores</Text>
      </View>

      {/* Team A preview (when selecting team B) */}
      {step === 'teamB' && (
        <View style={styles.teamPreview}>
          <Text style={styles.teamPreviewLabel}>Time A:</Text>
          {teamA.map(p => (
            <Text key={p.id} style={styles.teamPreviewName}>{p.name.split("'")[0]}</Text>
          ))}
        </View>
      )}

      {/* Player list */}
      {loading ? (
        <ActivityIndicator color={COLORS.accent} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={availablePlayers}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => {
            const isSelected = selected.includes(item.id);
            const tier = getTier(item.rating);
            return (
              <TouchableOpacity
                testID={`sr_btn_select_${item.id}`}
                style={[styles.playerCard, isSelected && styles.playerCardSelected]}
                onPress={() => togglePlayer(item)}
              >
                <Text style={styles.playerEmoji}>{tier.emoji}</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.playerName}>{item.name}</Text>
                  <Text style={[styles.playerTier, { color: tier.color }]}>
                    {tier.name} · {item.rating} · {item.matches_played} partidas
                  </Text>
                </View>
                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Confirm button */}
      <View style={styles.footer}>
        <TouchableOpacity
          testID="sr_btn_confirm_team"
          style={[styles.confirmBtn, selected.length !== 2 && styles.confirmBtnDisabled]}
          onPress={confirmTeam}
          disabled={selected.length !== 2}
        >
          <Text style={styles.confirmBtnText}>
            {step === 'teamA' ? 'Confirmar Time A →' : '⚡ Iniciar Partida'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  header: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  cancelText: { fontSize: 14, color: COLORS.accent, marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  teamPreview: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    backgroundColor: COLORS.bgCard, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  teamPreviewLabel: { fontSize: 12, fontWeight: '600', color: COLORS.accent },
  teamPreviewName: { fontSize: 12, color: COLORS.textSecondary },
  playerCard: {
    flexDirection: 'row', alignItems: 'center', padding: SPACING.md,
    marginHorizontal: SPACING.md, marginBottom: SPACING.sm,
    backgroundColor: COLORS.bgCard, borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  playerCardSelected: { borderColor: COLORS.accent, backgroundColor: 'rgba(0, 212, 255, 0.08)' },
  playerEmoji: { fontSize: 28 },
  playerName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  playerTier: { fontSize: 11, marginTop: 2 },
  checkbox: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxSelected: { borderColor: COLORS.accent, backgroundColor: COLORS.accent },
  checkmark: { fontSize: 14, fontWeight: '800', color: COLORS.bgPrimary },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: SPACING.md, backgroundColor: 'rgba(6, 11, 24, 0.95)',
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  confirmBtn: {
    backgroundColor: COLORS.accent, paddingVertical: 14,
    borderRadius: BORDER_RADIUS.sm, alignItems: 'center',
  },
  confirmBtnDisabled: { opacity: 0.4 },
  confirmBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.bgPrimary },
});
