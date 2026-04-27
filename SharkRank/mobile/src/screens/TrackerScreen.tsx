import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FundamentoButton } from '../components/FundamentoButton';
import { CalibrationSurvey } from '../components/CalibrationSurvey';
import { PlayerSelectScreen } from './PlayerSelectScreen';
import { calculateMatchProvisionalELO } from '../services/elo';
import { enqueueSync } from '../services/sync';
import { getFlag } from '../services/flags';
import { SharkVisionCamera, SharkVisionHandle } from '../components/SharkVisionCamera';
import * as MediaLibrary from 'expo-media-library';
import { COLORS, SPACING, BORDER_RADIUS, FUNDAMENTOS } from '../theme';

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

import { Video, ResizeMode } from 'expo-av';

interface MatchEvent {
  type: string;
  player: string;
  timestamp: string;
  videoUri?: string;
}

interface SetData {
  scoreA: number;
  scoreB: number;
  events: MatchEvent[];
}

interface MatchConfig {
  maxSets: number;
  pointsToWin: number;
  winByTwo: boolean;
  pointCap: number;
}

export function TrackerScreen() {
  const [selectedTeams, setSelectedTeams] = useState<SelectedTeams | null>(null);
  const [config, setConfig] = useState<MatchConfig>({ maxSets: 1, pointsToWin: 18, winByTwo: true, pointCap: 20 });
  const [isConfigured, setIsConfigured] = useState(false);

  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [setsA, setSetsA] = useState(0);
  const [setsB, setSetsB] = useState(0);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [allSets, setAllSets] = useState<SetData[]>([]);
  
  const [activePlayerForAction, setActivePlayerForAction] = useState<Player | null>(null);
  
  const [matchFinished, setMatchFinished] = useState(false);
  const [provisionalELO, setProvisionalELO] = useState<Record<string, number> | null>(null);
  const [showSurvey, setShowSurvey] = useState(false);
  const [replayUri, setReplayUri] = useState<string | null>(null);
  const [isCameraFull, setIsCameraFull] = useState(false);
  const sharkVisionRef = useRef<SharkVisionHandle>(null);

  const matchId = useState(() => Date.now().toString(36) + Math.random().toString(36).substr(2, 9))[0];

  useEffect(() => {
    if (isConfigured && !matchFinished) {
      setTimeout(() => sharkVisionRef.current?.startRecording(), 1000);
    }
  }, [isConfigured, matchFinished]);

  const handleActionSelected = async (fundamentoKey: string, isError: boolean) => {
    if (!activePlayerForAction || !selectedTeams) return;
    
    // Captura o vídeo do ponto que acabou de acontecer
    const videoUri = await sharkVisionRef.current?.stopRecording();
    // Inicia a gravação do PRÓXIMO ponto
    sharkVisionRef.current?.startRecording();

    const event: MatchEvent = { 
      type: fundamentoKey, 
      player: activePlayerForAction.id, 
      timestamp: new Date().toISOString(),
      videoUri: videoUri || undefined,
    };
    
    setEvents(prev => [...prev, event]);
    
    const isPlayerTeamA = selectedTeams.teamA.some(p => p.id === activePlayerForAction.id);
    let newScoreA = scoreA;
    let newScoreB = scoreB;

    if (isError) {
      if (isPlayerTeamA) newScoreB += 1;
      else newScoreA += 1;
    } else {
      if (isPlayerTeamA) newScoreA += 1;
      else newScoreB += 1;
    }

    setScoreA(newScoreA);
    setScoreB(newScoreB);
    setActivePlayerForAction(null);

    checkSetFinish(newScoreA, newScoreB);
  };

  const checkSetFinish = (newA: number, newB: number) => {
    const limit = config.pointsToWin;
    const diff = Math.abs(newA - newB);
    let isSetOver = false;

    if (newA >= limit || newB >= limit) {
      if (config.winByTwo) {
        if (diff >= 2) isSetOver = true;
        if (newA >= config.pointCap || newB >= config.pointCap) isSetOver = true;
      } else {
        isSetOver = true;
      }
    }

    if (isSetOver) {
      finishSet(newA, newB);
    }
  };

  const finishSet = (finalA: number, finalB: number) => {
    const setData: SetData = { scoreA: finalA, scoreB: finalB, events: [...events] };
    const newSets = [...allSets, setData];
    setAllSets(newSets);
    setEvents([]);

    const newSetsA = setsA + (finalA > finalB ? 1 : 0);
    const newSetsB = setsB + (finalB > finalA ? 1 : 0);
    setSetsA(newSetsA);
    setSetsB(newSetsB);
    setScoreA(0);
    setScoreB(0);

    const setsToWin = Math.ceil(config.maxSets / 2);
    if (newSetsA >= setsToWin || newSetsB >= setsToWin) {
      finishMatch(newSets, newSetsA > newSetsB);
    }
  };

  const finishMatch = async (sets: SetData[], teamAWon: boolean) => {
    if (!selectedTeams) return;
    setMatchFinished(true);

    const teamAIds = selectedTeams.teamA.map(p => p.id);
    const teamBIds = selectedTeams.teamB.map(p => p.id);
    
    const ratings: Record<string, number> = {};
    const counts: Record<string, number> = {};
    [...selectedTeams.teamA, ...selectedTeams.teamB].forEach(p => {
      ratings[p.id] = p.rating;
      counts[p.id] = p.matches_played;
    });

    const elo = calculateMatchProvisionalELO(
      teamAIds, teamBIds, ratings, counts, teamAWon,
    );
    setProvisionalELO(elo);

    const matchPayload = {
      match_id: matchId,
      arena_id: 'arena-blumenau-01',
      idempotency_key: matchId + ':' + (sets[0]?.events[0]?.timestamp || Date.now()),
      team_a: teamAIds,
      team_b: teamBIds,
      sets: sets.map(s => ({
        score_a: s.scoreA,
        score_b: s.scoreB,
        events: s.events,
      })),
      elo_provisional: elo,
      client_version: '1.1.0',
      elo_config_version: 'v1',
    };

    await enqueueSync('/matches', 'POST', matchPayload);

    if (getFlag('SHOW_SURVEY')) setShowSurvey(true);
  };

  const manualEndMatch = () => {
    Alert.alert("Encerrar Partida", "Deseja encerrar por W.O. ou desistência?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Vitória Time A", onPress: () => finishMatch([...allSets, {scoreA, scoreB, events}], true) },
      { text: "Vitória Time B", onPress: () => finishMatch([...allSets, {scoreA, scoreB, events}], false) },
    ]);
  };

  const resetMatch = () => {
    setScoreA(0); setScoreB(0); setSetsA(0); setSetsB(0);
    setEvents([]); setAllSets([]); setMatchFinished(false); 
    setProvisionalELO(null); setShowSurvey(false); 
    setIsConfigured(false); setSelectedTeams(null);
  };

  if (!selectedTeams) {
    return (
      <PlayerSelectScreen
        arenaId="arena-blumenau-01"
        onTeamsSelected={setSelectedTeams}
        onCancel={() => {}} 
      />
    );
  }

  if (!isConfigured) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.configTitle}>Configuração da Partida</Text>
        
        <View style={styles.configCard}>
          <Text style={styles.configLabel}>Número de Sets: {config.maxSets}</Text>
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.configBtn} onPress={() => setConfig({...config, maxSets: 1})}><Text style={styles.btnText}>1 Set</Text></TouchableOpacity>
            <TouchableOpacity style={styles.configBtn} onPress={() => setConfig({...config, maxSets: 3})}><Text style={styles.btnText}>3 Sets</Text></TouchableOpacity>
          </View>

          <Text style={styles.configLabel}>Pontos para Vencer: {config.pointsToWin}</Text>
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.configBtn} onPress={() => setConfig({...config, pointsToWin: 15})}><Text style={styles.btnText}>15</Text></TouchableOpacity>
            <TouchableOpacity style={styles.configBtn} onPress={() => setConfig({...config, pointsToWin: 18})}><Text style={styles.btnText}>18</Text></TouchableOpacity>
            <TouchableOpacity style={styles.configBtn} onPress={() => setConfig({...config, pointsToWin: 21})}><Text style={styles.btnText}>21</Text></TouchableOpacity>
          </View>

          <Text style={styles.configLabel}>Vai a dois? (Vantagem): {config.winByTwo ? 'Sim' : 'Não'}</Text>
          <View style={styles.btnRow}>
            <TouchableOpacity style={[styles.configBtn, config.winByTwo && styles.activeBtn]} onPress={() => setConfig({...config, winByTwo: true})}><Text style={styles.btnText}>Sim</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.configBtn, !config.winByTwo && styles.activeBtn]} onPress={() => setConfig({...config, winByTwo: false})}><Text style={styles.btnText}>Não</Text></TouchableOpacity>
          </View>

          {config.winByTwo && (
            <>
              <Text style={styles.configLabel}>Teto (Cap) Máximo: {config.pointCap}</Text>
              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.configBtn} onPress={() => setConfig({...config, pointCap: config.pointsToWin + 2})}><Text style={styles.btnText}>{config.pointsToWin + 2}</Text></TouchableOpacity>
                <TouchableOpacity style={styles.configBtn} onPress={() => setConfig({...config, pointCap: 25})}><Text style={styles.btnText}>25</Text></TouchableOpacity>
                <TouchableOpacity style={styles.configBtn} onPress={() => setConfig({...config, pointCap: 30})}><Text style={styles.btnText}>30</Text></TouchableOpacity>
              </View>
            </>
          )}

          <TouchableOpacity style={styles.startBtn} onPress={() => setIsConfigured(true)}>
            <Text style={styles.startBtnText}>▶ Iniciar Partida</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (showSurvey) {
    return (
      <CalibrationSurvey
        matchId={matchId}
        arenaId="arena-blumenau-01"
        onComplete={() => setShowSurvey(false)}
        onSkip={() => setShowSurvey(false)}
      />
    );
  }

  if (matchFinished && provisionalELO) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.resultContainer}>
          <Text style={styles.resultEmoji}>🏆</Text>
          <Text style={styles.resultTitle}>Partida Finalizada!</Text>
          <Text style={styles.resultScore}>{setsA} × {setsB}</Text>
          
          <Text style={styles.partialsText}>
            Parciais: {allSets.map(s => `[${s.scoreA}x${s.scoreB}]`).join(' ')}
          </Text>

          <View style={styles.eloCard}>
            <Text style={styles.eloTitle}>ELO Provisório ✓</Text>
            {Object.entries(provisionalELO).map(([pid, rating]) => (
              <View key={pid} style={styles.eloRow}>
                <Text style={styles.eloPlayer}>{pid}</Text>
                <Text style={styles.eloValue}>{rating}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.newMatchBtn} onPress={resetMatch}>
            <Text style={styles.newMatchBtnText}>Nova Partida</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* SharkVision AI - Modo Normal */}
      {isConfigured && !matchFinished && !isCameraFull && (
        <SharkVisionCamera 
          ref={sharkVisionRef} 
          isFull={false} 
          onToggleFull={() => setIsCameraFull(true)} 
        />
      )}

      {/* SharkVision AI - Modo FullScreen (Solução Atômica via Modal) */}
      <Modal 
        visible={isCameraFull} 
        animationType="fade" 
        transparent={false}
        onRequestClose={() => setIsCameraFull(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <SharkVisionCamera 
            ref={sharkVisionRef} 
            isFull={true} 
            onToggleFull={() => setIsCameraFull(false)} 
          />
          
          {/* Overlay de Marcação Rápida no Modal */}
          <View style={styles.fullOverlay} pointerEvents="box-none">
            {/* Placar Central de Topo */}
            <View style={styles.fullScoreboard} pointerEvents="none">
              <View style={{alignItems: 'center'}}>
                <Text style={styles.fullScoreValue}>{scoreA}</Text>
                <Text style={styles.fullSetsText}>{setsA} SETS</Text>
              </View>
              <Text style={styles.fullScoreDivider}>×</Text>
              <View style={{alignItems: 'center'}}>
                <Text style={styles.fullScoreValue}>{scoreB}</Text>
                <Text style={styles.fullSetsText}>{setsB} SETS</Text>
              </View>
            </View>

            <View style={styles.fullTeamCol} pointerEvents="box-none">
              <Text style={styles.fullTeamLabel}>TIME A</Text>
              {selectedTeams.teamA.map(p => (
                <TouchableOpacity key={p.id} style={styles.fullPlayerBtn} onPress={() => setActivePlayerForAction(p)}>
                  <Text style={styles.fullPlayerText}>{p.name.split(' ')[0]}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.fullTeamCol} pointerEvents="box-none">
              <Text style={styles.fullTeamLabel}>TIME B</Text>
              {selectedTeams.teamB.map(p => (
                <TouchableOpacity key={p.id} style={styles.fullPlayerBtn} onPress={() => setActivePlayerForAction(p)}>
                  <Text style={styles.fullPlayerText}>{p.name.split(' ')[0]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 150 }} // Espaço extra para a TabBar
      >
        {/* Placar e Sets */}
        <View style={styles.scoreboard}>
          <View style={styles.scoreTeam}>
            <Text style={styles.scoreLabel}>TIME A</Text>
            <Text style={styles.scoreValue}>{scoreA}</Text>
            <Text style={styles.setsLabel}>{setsA} SETS</Text>
          </View>
          
          <View style={styles.scoreDivider}>
            <View style={styles.probabilityBarContainer}>
               <View style={[styles.probabilityBar, { 
                 width: '100%', 
                 backgroundColor: COLORS.bgTertiary,
                 position: 'absolute' 
               }]} />
               <View style={[styles.probabilityBar, { 
                 width: `${(scoreA / (scoreA + scoreB + 0.1)) * 100}%`, 
                 backgroundColor: COLORS.accent 
               }]} />
            </View>
            <Text style={styles.vsText}>VS</Text>
            {allSets.length > 0 && (
              <Text style={{color: COLORS.accent, fontSize: 9, fontWeight: '900', marginTop: 10}}>
                LIVE
              </Text>
            )}
          </View>

          <View style={styles.scoreTeam}>
            <Text style={styles.scoreLabel}>TIME B</Text>
            <Text style={styles.scoreValue}>{scoreB}</Text>
            <Text style={styles.setsLabel}>{setsB} SETS</Text>
          </View>
        </View>

        <Text style={{color: COLORS.textMuted, fontSize: 10, fontWeight: '800', textAlign: 'center', marginTop: 25, letterSpacing: 3, textTransform: 'uppercase'}}>
          Selecione o Atleta
        </Text>

        {/* Grid de Jogadores */}
        <View style={styles.playersGrid}>
          <View style={styles.teamCol}>
            {selectedTeams.teamA.map(p => (
              <TouchableOpacity key={p.id} style={styles.playerBtn} onPress={() => setActivePlayerForAction(p)}>
                <Text style={styles.playerBtnText}>{p.name.split(' ')[0]}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.teamCol}>
            {selectedTeams.teamB.map(p => (
              <TouchableOpacity key={p.id} style={styles.playerBtn} onPress={() => setActivePlayerForAction(p)}>
                <Text style={styles.playerBtnText}>{p.name.split(' ')[0]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.woBtn} onPress={manualEndMatch}>
          <Text style={styles.woBtnText}>Encerrar Partida (W.O.)</Text>
        </TouchableOpacity>

        {/* Histórico de Pontos Prime */}
        <View style={styles.historySection}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}>
            <Text style={styles.historyTitle}>CRONOLOGIA DE PONTOS</Text>
            <View style={{width: 40, height: 2, backgroundColor: COLORS.accent + '40'}} />
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyScroll}>
            {events.slice().reverse().map((item, idx) => {
              const p = [...selectedTeams.teamA, ...selectedTeams.teamB].find(p => p.id === item.player);
              const fundamento = FUNDAMENTOS.find(f => f.key === item.type);
              const isError = fundamento?.isError;
              
              return (
                <View key={idx} style={[styles.historyCard, isError && {borderColor: COLORS.error + '40'}]}>
                  <View style={[styles.historyBadge, {backgroundColor: isError ? COLORS.error : COLORS.accent}]}>
                    <Text style={styles.historyEmoji}>{fundamento?.emoji}</Text>
                  </View>
                  <Text style={styles.historyName}>{p?.name.split(' ')[0]}</Text>
                  <Text style={styles.historyFundamento}>{fundamento?.label}</Text>
                  
                  {item.videoUri && (
                    <TouchableOpacity style={styles.miniReplayBtn} onPress={() => setReplayUri(item.videoUri!)}>
                      <Ionicons name="play" size={12} color={COLORS.accent} />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Modal de Ações */}
      <Modal visible={!!activePlayerForAction} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>O que {activePlayerForAction?.name} fez?</Text>
            
            <Text style={styles.modalSubtitle}>Pontos (Positivos)</Text>
            <View style={styles.fundRow}>
              {FUNDAMENTOS.filter(f => !f.isError).map(f => (
                <TouchableOpacity key={f.key} style={styles.fundBtn} onPress={() => handleActionSelected(f.key, false)}>
                  <Text style={styles.fundEmoji}>{f.emoji}</Text>
                  <Text style={styles.fundLabel}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.modalSubtitle, {color: COLORS.error, marginTop: 15}]}>Erros (Ponto Adversário)</Text>
            <View style={styles.fundRow}>
              {FUNDAMENTOS.filter(f => f.isError).map(f => (
                <TouchableOpacity key={f.key} style={[styles.fundBtn, styles.fundBtnErr]} onPress={() => handleActionSelected(f.key, true)}>
                  <Text style={styles.fundEmoji}>{f.emoji}</Text>
                  <Text style={styles.fundLabel}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setActivePlayerForAction(null)}>
              <Text style={styles.btnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Replay SharkVision (Sprint 8) */}
      <Modal visible={!!replayUri} transparent animationType="fade">
        <View style={styles.replayModalBg}>
          <View style={styles.replayContainer}>
            {replayUri && (
              <Video
                style={styles.videoPlayer}
                source={{ uri: replayUri }}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
              />
            )}
            <TouchableOpacity 
              style={styles.closeReplayBtn} 
              onPress={() => setReplayUri(null)}
            >
              <Text style={styles.closeReplayText}>FECHAR REPLAY</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.bgPrimary,
    paddingBottom: 120, // Garante que NADA fique embaixo da TabBar flutuante
  },
  scoreboard: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(15, 23, 42, 0.8)', 
    padding: 15, 
    marginHorizontal: 16, 
    marginTop: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  scoreTeam: { flex: 1, alignItems: 'center' },
  scoreDivider: { width: 60, alignItems: 'center', justifyContent: 'center' },
  scoreLabel: { color: COLORS.accent, fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 5 },
  scoreValue: { color: '#FFF', fontSize: 48, fontWeight: '900', textShadowColor: COLORS.accent, textShadowRadius: 15 },
  setsLabel: { backgroundColor: 'rgba(0, 212, 255, 0.1)', color: COLORS.accent, fontSize: 10, fontWeight: '800', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginTop: 5 },
  vsText: { color: 'rgba(255,255,255,0.1)', fontSize: 28, fontWeight: '900', fontStyle: 'italic' },
  
  playersGrid: { flexDirection: 'row', marginHorizontal: 16, gap: 12, marginTop: 20 },
  teamCol: { flex: 1, gap: 12 },
  playerBtn: { 
    backgroundColor: 'rgba(30, 41, 59, 0.5)', 
    paddingVertical: 18, 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  playerBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  woBtn: { marginTop: 30, marginBottom: 20, marginHorizontal: 40, padding: 12, borderRadius: 30, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.textMuted },
  woBtnText: { color: COLORS.textMuted, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2 },
  
  historySection: { marginHorizontal: 16, marginBottom: 20, marginTop: 10 },
  historyTitle: { color: COLORS.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  historyScroll: { gap: 15, paddingRight: 20 },
  historyCard: { 
    backgroundColor: 'rgba(30, 41, 59, 0.4)', 
    padding: 12, 
    borderRadius: 18, 
    alignItems: 'center', 
    minWidth: 100, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.05)' 
  },
  historyBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  historyEmoji: { fontSize: 16 },
  historyName: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  historyFundamento: { color: COLORS.textMuted, fontSize: 9, fontWeight: '600', marginTop: 2 },
  miniReplayBtn: { marginTop: 8, backgroundColor: 'rgba(0, 212, 255, 0.1)', padding: 6, borderRadius: 10 },

  probabilityBarContainer: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 15,
  },
  probabilityBar: {
    height: '100%',
    borderRadius: 2,
  },

  replayModalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  replayContainer: { width: '90%', height: '80%', backgroundColor: '#000', borderRadius: 20, overflow: 'hidden' },
  videoPlayer: { flex: 1 },
  closeReplayBtn: { padding: 20, alignItems: 'center', backgroundColor: COLORS.bgTertiary },
  closeReplayText: { color: COLORS.textPrimary, fontWeight: 'bold' },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.bgSecondary, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalTitle: { color: COLORS.textPrimary, fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  modalSubtitle: { color: COLORS.accent, fontSize: 14, fontWeight: '600', marginBottom: 10 },
  fundRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  fundBtn: { backgroundColor: COLORS.bgTertiary, padding: 15, borderRadius: 10, alignItems: 'center', width: '31%', borderWidth: 1, borderColor: COLORS.border },
  fundBtnErr: { borderColor: 'rgba(255,0,0,0.3)', backgroundColor: 'rgba(255,0,0,0.1)' },
  fundEmoji: { fontSize: 24, marginBottom: 5 },
  fundLabel: { color: COLORS.textPrimary, fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
  cancelBtn: { backgroundColor: COLORS.bgTertiary, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  btnText: { color: COLORS.textPrimary, fontWeight: 'bold' },
  configTitle: { color: COLORS.textPrimary, fontSize: 24, fontWeight: 'bold', margin: 20, textAlign: 'center' },
  configCard: { backgroundColor: COLORS.bgSecondary, margin: 16, padding: 20, borderRadius: BORDER_RADIUS.md, gap: 15 },
  configLabel: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
  btnRow: { flexDirection: 'row', gap: 10 },
  startBtnText: { color: COLORS.bgPrimary, fontWeight: 'bold', fontSize: 16 },
  resultContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  resultEmoji: { fontSize: 64, marginBottom: 10 },
  resultTitle: { color: COLORS.textPrimary, fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  resultScore: { color: COLORS.accent, fontSize: 48, fontWeight: '900', marginBottom: 5 },
  partialsText: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 30 },
  eloCard: { backgroundColor: COLORS.bgSecondary, padding: 20, borderRadius: BORDER_RADIUS.md, width: '100%', marginBottom: 30 },
  eloTitle: { color: COLORS.success, fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  eloRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  eloPlayer: { color: COLORS.textPrimary, fontSize: 16 },
  eloValue: { color: COLORS.accent, fontSize: 16, fontWeight: 'bold' },
  configBtn: {
    flex: 1, backgroundColor: COLORS.bgTertiary, padding: 12, borderRadius: 10,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  activeBtn: { borderColor: COLORS.accent, backgroundColor: 'rgba(0, 212, 255, 0.15)' },
  startBtn: {
    backgroundColor: COLORS.accent, padding: 16, borderRadius: BORDER_RADIUS.md,
    alignItems: 'center', marginTop: 10,
  },
  newMatchBtn: { backgroundColor: COLORS.accent, padding: 16, borderRadius: BORDER_RADIUS.md, width: '100%', alignItems: 'center' },
  newMatchBtnText: { color: COLORS.bgPrimary, fontSize: 16, fontWeight: 'bold' },
  
  // FullScreen Score Overlay
  fullOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 100, // Evita notch e bottom bar
    zIndex: 99999, // Acima de TUDO
  },
  fullTeamCol: {
    width: '45%',
    justifyContent: 'center',
    gap: 15,
  },
  fullPlayerBtn: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  fullPlayerText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    textShadowColor: '#000',
    textShadowRadius: 4,
  },
  fullTeamLabel: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    letterSpacing: 2,
  },
  fullScoreboard: {
    position: 'absolute',
    top: 100, // Zona Neutra: Abaixo dos controles de hardware, acima dos botes
    left: '28%',
    right: '28%',
    backgroundColor: 'rgba(0,0,0,0.85)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    gap: 12,
    zIndex: 99999,
  },
  fullScoreValue: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
  },
  fullScoreDivider: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: 'bold',
  },
  fullSetsText: {
    color: COLORS.textSecondary,
    fontSize: 8,
    fontWeight: 'bold',
    marginTop: 1,
    letterSpacing: 1,
  },
});
