import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme';
import { api } from '../services/api';

interface Player {
  id: string;
  name: string;
}

interface MatchEntry {
  id: string;
  date: string;
  playerA1: Player | null;
  playerA2: Player | null;
  playerB1: Player | null;
  playerB2: Player | null;
  scoreA: string;
  scoreB: string;
}

export function BatchMatchesModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [entries, setEntries] = useState<MatchEntry[]>([createEmptyEntry()]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectingFor, setSelectingFor] = useState<{ entryId: string; field: keyof MatchEntry } | null>(null);

  useEffect(() => {
    if (visible) loadPlayers();
  }, [visible]);

  async function loadPlayers() {
    try {
      const data = await api.getArenaPlayers('arena-blumenau-01');
      setPlayers(data.players);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível carregar os atletas.');
    } finally {
      setLoading(false);
    }
  }

  function createEmptyEntry(): MatchEntry {
    const today = new Date().toLocaleDateString('pt-BR');
    return {
      id: Math.random().toString(36).substr(2, 9),
      date: today,
      playerA1: null, playerA2: null,
      playerB1: null, playerB2: null,
      scoreA: '', scoreB: ''
    };
  }

  const addEntry = () => setEntries([...entries, createEmptyEntry()]);
  const removeEntry = (id: string) => setEntries(entries.filter(e => e.id !== id));

  const updateEntry = (id: string, field: keyof MatchEntry, value: any) => {
    setEntries(entries.map(e => e.id === id ? { ...e, [field]: value } : e));
    if (field.toString().startsWith('player')) setSelectingFor(null);
  };

  const handleSave = async () => {
    // Validação: Pelo menos o primeiro jogador de cada time deve estar preenchido
    const isValid = entries.every(e => e.playerA1 && e.playerB1 && e.scoreA && e.scoreB);
    if (!isValid) {
      Alert.alert('Atenção', 'Preencha o Jogador 1 de cada time e o placar final.');
      return;
    }

    setSaving(true);
    try {
      const arenaId = 'arena-blumenau-01';
      for (const entry of entries) {
        const payload = {
          teamA: [entry.playerA1!.id, entry.playerA2?.id].filter(Boolean),
          teamB: [entry.playerB1!.id, entry.playerB2?.id].filter(Boolean),
          scoreA: parseInt(entry.scoreA),
          scoreB: parseInt(entry.scoreB),
          date: entry.date,
          status: 'FINISHED'
        };
        await api.createMatch(arenaId, payload);
      }
      Alert.alert('Sucesso', `${entries.length} partidas registradas com sucesso!`);
      onClose();
    } catch (e) {
      Alert.alert('Erro', 'Falha ao salvar lote de partidas.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} disabled={saving}>
            <Ionicons name="chevron-down" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Lote de Partidas</Text>
          <TouchableOpacity onPress={addEntry} disabled={saving}>
            <Ionicons name="add-circle" size={32} color={COLORS.accent} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
          {entries.map((entry, index) => (
            <View key={entry.id} style={styles.matchCard}>
              <View style={styles.cardHeader}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                  <Text style={styles.matchIndex}>#{index + 1}</Text>
                  <TextInput
                    style={styles.dateInput}
                    value={entry.date}
                    onChangeText={(txt) => updateEntry(entry.id, 'date', txt)}
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                  />
                </View>
                {entries.length > 1 && (
                  <TouchableOpacity onPress={() => removeEntry(entry.id)} disabled={saving}>
                    <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.teamsRow}>
                {/* TIME A */}
                <View style={styles.teamCol}>
                  <TouchableOpacity 
                    style={[styles.playerPicker, entry.playerA1 && styles.playerSelected]} 
                    onPress={() => setSelectingFor({ entryId: entry.id, field: 'playerA1' })}
                    disabled={saving}
                  >
                    <Text style={styles.playerText} numberOfLines={1}>{entry.playerA1?.name || 'Jogador 1'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.playerPicker, entry.playerA2 && styles.playerSelected]} 
                    onPress={() => setSelectingFor({ entryId: entry.id, field: 'playerA2' })}
                    disabled={saving}
                  >
                    <Text style={styles.playerText} numberOfLines={1}>{entry.playerA2?.name || 'Jogador 2'}</Text>
                    {entry.playerA2 && (
                      <TouchableOpacity 
                        style={{position: 'absolute', right: 5, top: 10}}
                        onPress={() => updateEntry(entry.id, 'playerA2', null)}
                      >
                        <Ionicons name="close-circle" size={14} color="#888" />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                </View>

                {/* PLACAR */}
                <View style={styles.scoreCol}>
                  <TextInput
                    style={styles.scoreInput}
                    placeholder="00"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    keyboardType="numeric"
                    value={entry.scoreA}
                    onChangeText={(txt) => updateEntry(entry.id, 'scoreA', txt)}
                    editable={!saving}
                  />
                  <Text style={styles.vs}>×</Text>
                  <TextInput
                    style={styles.scoreInput}
                    placeholder="00"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    keyboardType="numeric"
                    value={entry.scoreB}
                    onChangeText={(txt) => updateEntry(entry.id, 'scoreB', txt)}
                    editable={!saving}
                  />
                </View>

                {/* TIME B */}
                <View style={styles.teamCol}>
                  <TouchableOpacity 
                    style={[styles.playerPicker, entry.playerB1 && styles.playerSelected]} 
                    onPress={() => setSelectingFor({ entryId: entry.id, field: 'playerB1' })}
                    disabled={saving}
                  >
                    <Text style={styles.playerText} numberOfLines={1}>{entry.playerB1?.name || 'Jogador 1'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.playerPicker, entry.playerB2 && styles.playerSelected]} 
                    onPress={() => setSelectingFor({ entryId: entry.id, field: 'playerB2' })}
                    disabled={saving}
                  >
                    <Text style={styles.playerText} numberOfLines={1}>{entry.playerB2?.name || 'Jogador 2'}</Text>
                    {entry.playerB2 && (
                      <TouchableOpacity 
                        style={{position: 'absolute', right: 5, top: 10}}
                        onPress={() => updateEntry(entry.id, 'playerB2', null)}
                      >
                        <Ionicons name="close-circle" size={14} color="#888" />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}

          <TouchableOpacity 
            style={[styles.saveBtn, saving && { opacity: 0.5 }]} 
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#060B18" />
            ) : (
              <Text style={styles.saveBtnText}>SALVAR LOTE</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      {/* Modal de Seleção de Jogador */}
      <Modal visible={!!selectingFor} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecionar Atleta</Text>
            <FlatList
              data={players}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.playerItem} 
                  onPress={() => updateEntry(selectingFor!.entryId, selectingFor!.field, item)}
                >
                  <Text style={styles.playerItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.closeModal} onPress={() => setSelectingFor(null)}>
              <Text style={{color: COLORS.accent, fontWeight: 'bold'}}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  loader: { flex: 1, backgroundColor: COLORS.bgPrimary, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  title: { color: '#FFF', fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  matchCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.1)',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  matchIndex: { color: COLORS.accent, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  dateInput: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '600', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5 },
  teamsRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  teamCol: { flex: 2, gap: 8 },
  scoreCol: { flex: 1, alignItems: 'center', gap: 5 },
  playerPicker: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  playerSelected: { borderColor: COLORS.accent + '60' },
  playerText: { color: '#FFF', fontSize: 11, fontWeight: '600' },
  scoreInput: {
    backgroundColor: '#0F172A',
    width: 50,
    height: 40,
    borderRadius: 10,
    textAlign: 'center',
    color: COLORS.accent,
    fontSize: 18,
    fontWeight: '900',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  vs: { color: 'rgba(255,255,255,0.2)', fontWeight: 'bold' },
  saveBtn: {
    backgroundColor: COLORS.accent,
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  saveBtnText: { color: '#060B18', fontWeight: '900', letterSpacing: 2 },
  
  // Modal
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: COLORS.bgSecondary, width: '85%', maxHeight: '70%', borderRadius: 25, padding: 20 },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', marginBottom: 20, textAlign: 'center' },
  playerItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  playerItemText: { color: '#FFF', fontSize: 16 },
  closeModal: { marginTop: 20, alignItems: 'center' },
});
