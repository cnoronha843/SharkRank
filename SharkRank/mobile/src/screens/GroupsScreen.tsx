import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, getTier } from '../theme';
import { api } from '../services/api';
import { RadarChart } from '../components/RadarChart';
import { MatchTimeline } from '../components/MatchTimeline';

interface Group {
  id: string;
  name: string;
  sport: string;
  member_count: number;
}

interface Player {
  id: string;
  name: string;
  rating: number;
  matches_played: number;
  wins: number;
  points: number;
  errors: number;
}

export function GroupsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSport, setNewSport] = useState('Vôlei de Praia');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupRanking, setGroupRanking] = useState<Player[]>([]);
  const [loadingRanking, setLoadingRanking] = useState(false);

  // Perfil do Jogador Selecionado
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [playerStats, setPlayerStats] = useState<any>(null);
  const [playerMatches, setPlayerMatches] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (visible) loadGroups();
  }, [visible]);

  useEffect(() => {
    if (selectedGroup) loadGroupRanking(selectedGroup.id);
  }, [selectedGroup]);

  useEffect(() => {
    if (selectedPlayer) loadPlayerData(selectedPlayer.id);
  }, [selectedPlayer]);

  async function loadGroups() {
    setLoading(true);
    try {
      const data = await api.getArenaGroups('arena-blumenau-01');
      setGroups(data.groups || []);
    } catch (e) {
      // Mock inicial caso API não esteja pronta
      setGroups([
        { id: '1', name: 'Racha dos Amigos', sport: 'Futvôlei', member_count: 12 },
        { id: '2', name: 'Torneio Arena Prime', sport: 'Vôlei de Praia', member_count: 32 },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function loadGroupRanking(groupId: string) {
    setLoadingRanking(true);
    try {
      const data = await api.getGroupRanking(groupId);
      setGroupRanking(data.ranking || []);
    } catch (e) {
      // Mock de ranking
      setGroupRanking([
        { id: 'p1', name: 'Carlão', wins: 15, points: 45, errors: 4, rating: 1400 },
        { id: 'p2', name: 'Lucas', wins: 12, points: 38, errors: 7, rating: 1350 },
      ]);
    } finally {
      setLoadingRanking(false);
    }
  }

  async function loadPlayerData(pid: string) {
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
  }

  async function handleCreate() {
    if (!newName) return Alert.alert('Atenção', 'Digite um nome para o grupo.');
    try {
      await api.createGroup('arena-blumenau-01', { name: newName, sport: newSport });
      setShowCreate(false);
      setNewName('');
      loadGroups();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível criar o grupo.');
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => selectedGroup ? setSelectedGroup(null) : onClose()}>
            <Ionicons name={selectedGroup ? "chevron-back" : "chevron-down"} size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.title}>{selectedGroup ? selectedGroup.name : "Meus Grupos"}</Text>
          <TouchableOpacity onPress={() => setShowCreate(true)}>
            <Ionicons name="add-circle" size={32} color={COLORS.accent} />
          </TouchableOpacity>
        </View>

        {!selectedGroup ? (
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {groups.map(group => (
              <TouchableOpacity 
                key={group.id} 
                style={styles.groupCard}
                onPress={() => setSelectedGroup(group)}
              >
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.groupSport}>{group.sport} • {group.member_count} Atletas</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.2)" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={{ flex: 1 }}>
            <View style={styles.rankingHeader}>
              <Text style={styles.sectionTitle}>🏆 Ranking do Grupo</Text>
            </View>
            <FlatList
              data={groupRanking}
              keyExtractor={item => item.id}
              contentContainerStyle={{ padding: 20 }}
              renderItem={({ item, index }) => {
                const tier = getTier(item.rating);
                return (
                  <TouchableOpacity style={styles.rankCard} onPress={() => setSelectedPlayer(item)}>
                    <View style={[styles.pos, index < 3 && { backgroundColor: tier.color }]}>
                      <Text style={[styles.posText, index < 3 && { color: COLORS.bgPrimary }]}>{index + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{item.name}</Text>
                      <View style={styles.statsRow}>
                        <Text style={styles.statMini}>🥇 {item.wins}V</Text>
                        <Text style={styles.statMini}>☄️ {item.points}P</Text>
                        <Text style={[styles.statMini, {color: COLORS.error}]}>🚫 {item.errors}E</Text>
                      </View>
                    </View>
                    <Ionicons name="stats-chart" size={14} color="rgba(255,255,255,0.1)" />
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}

        {/* Modal de Perfil de Jogador */}
        <Modal visible={!!selectedPlayer} transparent animationType="slide">
          {selectedPlayer && (() => {
            const tier = getTier(selectedPlayer.rating);
            const wins = playerStats?.wins || 0;
            const losses = playerStats?.losses || 0;
            const total = wins + losses;
            const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

            const radarData = [
              { label: 'Ataque', value: playerStats?.fundamentals?.shark_ataque ? Math.min(playerStats.fundamentals.shark_ataque * 10, 100) : 45 },
              { label: 'Defesa', value: playerStats?.fundamentals?.coxa ? Math.min(playerStats.fundamentals.coxa * 8, 100) : 60 },
              { label: 'Recepção', value: playerStats?.fundamentals?.peito ? Math.min(playerStats.fundamentals.peito * 12, 100) : 55 },
              { label: 'Precisão', value: 75 },
              { label: 'Vigor', value: 80 },
            ];

            return (
              <View style={styles.modalBg}>
                <View style={styles.modalContentProfile}>
                  <ScrollView 
                    style={{ width: '100%' }} 
                    contentContainerStyle={{ alignItems: 'center' }}
                    showsVerticalScrollIndicator={false}
                  >
                    <View style={styles.modalHeaderProfile}>
                      <Text style={styles.modalEmojiProfile}>{tier.emoji}</Text>
                      <Text style={styles.modalPlayerNameProfile}>{selectedPlayer.name}</Text>
                      <Text style={[styles.modalTierNameProfile, {color: tier.color}]}>{tier.name}</Text>
                    </View>

                    {loadingStats ? (
                      <ActivityIndicator color={COLORS.accent} style={{ margin: 40 }} />
                    ) : (
                      <>
                        <RadarChart data={radarData} size={180} />

                        <View style={styles.statsGridProfile}>
                          <View style={styles.statBoxProfile}>
                            <Text style={styles.statValueProfile}>{selectedPlayer.wins}</Text>
                            <Text style={styles.statLabelProfile}>Vitórias</Text>
                          </View>
                          <View style={styles.statBoxProfile}>
                            <Text style={[styles.statValueProfile, {color: COLORS.success}]}>{winRate}%</Text>
                            <Text style={styles.statLabelProfile}>Win Rate</Text>
                          </View>
                        </View>

                        <MatchTimeline matches={playerMatches} playerId={selectedPlayer.id} />
                      </>
                    )}

                    <TouchableOpacity style={styles.closeBtnProfile} onPress={() => setSelectedPlayer(null)}>
                      <Text style={styles.closeBtnTextProfile}>Fechar Perfil</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              </View>
            );
          })()}
        </Modal>

        {/* Modal Criar Grupo */}
        <Modal visible={showCreate} transparent animationType="fade">
          <View style={styles.modalBg}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Novo Grupo</Text>
              <TextInput
                style={styles.input}
                placeholder="Nome do Grupo (ex: Racha de Terça)"
                placeholderTextColor="#666"
                value={newName}
                onChangeText={setNewName}
              />
              <TextInput
                style={styles.input}
                placeholder="Esporte (ex: Futvôlei)"
                placeholderTextColor="#666"
                value={newSport}
                onChangeText={setNewSport}
              />
              <TouchableOpacity style={styles.saveBtn} onPress={handleCreate}>
                <Text style={styles.saveBtnText}>CRIAR GRUPO</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{marginTop: 15, alignItems: 'center'}} onPress={() => setShowCreate(false)}>
                <Text style={{color: COLORS.textMuted}}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  title: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  groupCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  groupInfo: { flex: 1 },
  groupName: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  groupSport: { color: COLORS.accent, fontSize: 12, marginTop: 4, fontWeight: '600' },
  
  // Ranking Interno
  rankingHeader: { paddingHorizontal: 20, paddingVertical: 10 },
  sectionTitle: { color: '#FFF', fontSize: 14, fontWeight: '800', opacity: 0.6 },
  rankCard: {
    flexDirection: 'row', alignItems: 'center', padding: 15,
    backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: 12,
    marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  pos: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.bgTertiary, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  posText: { color: COLORS.textSecondary, fontWeight: 'bold', fontSize: 10 },
  name: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  statMini: { color: COLORS.textSecondary, fontSize: 9, fontWeight: '800' },

  // Modal Create
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: COLORS.bgSecondary, width: '85%', borderRadius: 25, padding: 25 },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: 'rgba(0,0,0,0.2)', color: '#FFF', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  saveBtn: { backgroundColor: COLORS.accent, padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#060B18', fontWeight: '900' },

  // Profile Styles
  modalContentProfile: { backgroundColor: COLORS.bgSecondary, padding: 25, borderRadius: BORDER_RADIUS.md, width: '90%', maxHeight: '85%' },
  modalHeaderProfile: { alignItems: 'center', marginBottom: 20 },
  modalEmojiProfile: { fontSize: 40, marginBottom: 5 },
  modalPlayerNameProfile: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  modalTierNameProfile: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  statsGridProfile: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginVertical: 20, gap: 10 },
  statBoxProfile: { backgroundColor: 'rgba(255,255,255,0.03)', flex: 1, padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  statValueProfile: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  statLabelProfile: { color: COLORS.textSecondary, fontSize: 10, marginTop: 5 },
  closeBtnProfile: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 12, width: '100%', alignItems: 'center', marginTop: 20 },
  closeBtnTextProfile: { color: '#FFF', fontWeight: 'bold' },
});
