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
import { Modal, TextInput } from 'react-native';

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
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const data = await api.getArenaPlayers(arenaId);
      setPlayers(data.players);
    } catch {
      setPlayers([]); // Banco zerado conforme pedido
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) return;
    setSaving(true);
    try {
      await api.createPlayer(arenaId, {
        name: newPlayerName,
        nickname: newPlayerName.split(' ')[0],
        position: 'Atacante',
      });
      setNewPlayerName('');
      setShowAddModal(false);
      loadPlayers(); // Recarrega a lista
    } catch (e) {
      console.error("Error adding player", e);
    } finally {
      setSaving(false);
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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <TouchableOpacity onPress={onCancel}>
            <Text style={styles.cancelText}>← Voltar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowAddModal(true)}>
            <Text style={[styles.cancelText, { color: COLORS.success }]}>+ Novo Atleta</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>
          {step === 'teamA' ? '🔵 Selecione o Time A' : '🔴 Selecione o Time B'}
        </Text>
        <Text style={styles.subtitle}>Escolha 2 jogadores</Text>
      </View>

      {/* Team A preview... */}
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
      ) : players.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>👥</Text>
          <Text style={styles.emptyText}>Nenhum atleta cadastrado.</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowAddModal(true)}>
            <Text style={styles.emptyBtnText}>Cadastrar Primeiro Atleta</Text>
          </TouchableOpacity>
        </View>
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
                    {tier.name} · {Math.round(item.rating)} ELO · {item.matches_played} partidas
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

      {/* Modal de Cadastro (Sprint 7) */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Novo Atleta Estreante</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome Completo"
              placeholderTextColor={COLORS.textMuted}
              value={newPlayerName}
              onChangeText={setNewPlayerName}
              autoFocus
            />
            <Text style={styles.inputHint}>O atleta começará com 1000 de ELO (Estreante).</Text>
            
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setShowAddModal(false)}>
                <Text style={styles.btnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveBtn, saving && { opacity: 0.5 }]} 
                onPress={handleAddPlayer}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>{saving ? 'Salvando...' : 'Cadastrar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  confirmBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.bgPrimary },
  
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyEmoji: { fontSize: 64, marginBottom: 20 },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center', marginBottom: 30 },
  emptyBtn: { backgroundColor: COLORS.success, padding: 15, borderRadius: 10 },
  emptyBtnText: { color: COLORS.bgPrimary, fontWeight: 'bold' },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: COLORS.bgSecondary, padding: 25, borderRadius: 20 },
  modalTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  input: { 
    backgroundColor: COLORS.bgTertiary, color: COLORS.textPrimary, padding: 15, 
    borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, fontSize: 16 
  },
  inputHint: { color: COLORS.textMuted, fontSize: 11, marginTop: 8, marginBottom: 20 },
  modalBtnRow: { flexDirection: 'row', gap: 10 },
  cancelModalBtn: { flex: 1, padding: 15, alignItems: 'center', borderRadius: 10, backgroundColor: COLORS.bgTertiary },
  saveBtn: { flex: 2, padding: 15, alignItems: 'center', borderRadius: 10, backgroundColor: COLORS.success },
  saveBtnText: { color: COLORS.bgPrimary, fontWeight: 'bold' },
  btnText: { color: COLORS.textPrimary, fontWeight: 'bold' },
});
