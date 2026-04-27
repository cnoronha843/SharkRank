import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import { COLORS, BORDER_RADIUS } from '../theme';

export interface SharkVisionHandle {
  startRecording: () => Promise<string | null>;
  stopRecording: () => Promise<string | null>;
}

interface SharkVisionProps {
  isFull?: boolean;
  onToggleFull?: () => void;
}

export const SharkVisionCamera = forwardRef<SharkVisionHandle, SharkVisionProps>((props, ref) => {
  const insets = useSafeAreaInsets();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [clipDuration, setClipDuration] = useState<15 | 20 | 30>(20);
  const [lastClip, setLastClip] = useState<string | null>(null);
  const [showReplay, setShowReplay] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const recordingPromise = useRef<Promise<any> | null>(null);

  // Solicita todas as permissões automaticamente
  useEffect(() => {
    if (cameraPermission && !cameraPermission.granted) requestCameraPermission();
    if (micPermission && !micPermission.granted) requestMicPermission();
    if (mediaPermission && !mediaPermission.granted) requestMediaPermission();
  }, [cameraPermission, micPermission, mediaPermission]);

  const stopAndRestart = async () => {
    if (cameraRef.current && isRecording) {
      try {
        cameraRef.current.stopRecording();
        const result = await recordingPromise.current;
        
        if (result?.uri) {
          await MediaLibrary.saveToLibraryAsync(result.uri);
          setLastClip(result.uri); // Define o último clipe para a miniatura
        }

        // Delay técnico para o hardware processar o fim do arquivo anterior
        setTimeout(() => {
          if (cameraRef.current) {
            setIsRecording(true);
            recordingPromise.current = cameraRef.current.recordAsync({
              maxDuration: 60,   // Limite de segurança por clipe
            });
          }
        }, 150); 

        return result?.uri || null;
      } catch (e) {
        console.error("Clip error", e);
        setIsRecording(false);
        return null;
      }
    }
    return null;
  };

  useImperativeHandle(ref, () => ({
    startRecording: async () => {
      if (cameraRef.current && !isRecording) {
        setIsRecording(true);
        recordingPromise.current = cameraRef.current.recordAsync();
        return "started";
      }
      return null;
    },
    stopRecording: stopAndRestart
  }));

  if (!cameraPermission || !micPermission || !cameraPermission.granted || !micPermission.granted) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.permissionBtn} onPress={() => { requestCameraPermission(); requestMicPermission(); }}>
          <Ionicons name="videocam-off" size={32} color={COLORS.accent} />
          <Text style={styles.permissionText}>Ativar SharkVision AI</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, props.isFull && styles.fullScreenContainer]}>
      <CameraView
        style={styles.camera}
        ref={cameraRef}
        mode="video"
        facing="back"
        responsiveOrientationWhenOrientationLocked
      />
      
      {/* Overlay Profissional de Transmissão */}
      <View style={[styles.overlay, props.isFull && { paddingTop: insets.top + 10, zIndex: 9999 }]}>
        {/* Topo: Status e Configs */}
        <View style={styles.topRow}>
          <View style={styles.badge}>
            <Ionicons 
              name="radio-button-on" 
              size={14} 
              color={isRecording ? COLORS.error : '#555'} 
            />
            <Text style={styles.badgeText}>SHARKVISION {isRecording ? 'REC' : 'LIVE'}</Text>
          </View>
          
          <View style={styles.rightControls}>
            <View style={styles.selector}>
              {[15, 20, 30].map(d => (
                <TouchableOpacity 
                  key={d} 
                  onPress={() => setClipDuration(d as any)}
                  style={[styles.selectorBtn, clipDuration === d && styles.selectorBtnActive]}
                >
                  <Text style={styles.selectorText}>{d}s</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity onPress={props.onToggleFull} style={styles.iconBtn}>
              <Ionicons name={props.isFull ? "contract" : "expand"} size={22} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Base: Ações de Gravação (Zonas de Toque Seguras) */}
        <View style={[styles.bottomRow, props.isFull && { paddingBottom: insets.bottom + 40 }]}>
          {lastClip ? (
            <TouchableOpacity 
              style={[styles.varBtn, { shadowColor: COLORS.accent, shadowOpacity: 1, shadowRadius: 10 }]} 
              onPress={() => setShowReplay(true)}
            >
              <View style={styles.varBadge}>
                <Text style={styles.varBadgeText}>NEW</Text>
              </View>
              <Ionicons name="play-circle" size={props.isFull ? 54 : 42} color={COLORS.accent} />
              <Text style={styles.varText}>VAR</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 60 }} />
          )}

          <TouchableOpacity 
            style={[styles.mainClipBtn, props.isFull && { transform: [{ scale: 1.2 }] }]} 
            onPress={stopAndRestart}
          >
            <View style={[styles.clipIconBg, props.isFull && { backgroundColor: 'rgba(0, 212, 255, 0.7)' }]}>
              <Ionicons name="flash" size={props.isFull ? 32 : 28} color="#060B18" />
            </View>
            <Text style={styles.mainClipText}>CLIP {clipDuration}s</Text>
          </TouchableOpacity>
          
          <View style={{ width: 60 }} />
        </View>

        {/* Banner de VAR Instantâneo */}
        {lastClip && (
          <TouchableOpacity 
            style={styles.varToast} 
            onPress={() => setShowReplay(true)}
          >
            <Ionicons name="videocam" size={16} color="#060B18" />
            <Text style={styles.varToastText}>VAR DISPONÍVEL · REVER AGORA</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modal de VAR / Instant Replay */}
      <Modal visible={showReplay} transparent animationType="slide">
        <View style={styles.replayModalBg}>
          <View style={styles.replayHeader}>
            <Text style={styles.replayTitle}>SHARKVISION REPLAY</Text>
            <TouchableOpacity onPress={() => setShowReplay(false)}>
              <Ionicons name="close-circle" size={32} color="#FFF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.replayContent}>
            {lastClip && (
              <Video
                style={styles.fullVideo}
                source={{ uri: lastClip }}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
              />
            )}
          </View>
          
          <TouchableOpacity style={styles.resumeBtn} onPress={() => setShowReplay(false)}>
            <Text style={styles.resumeBtnText}>VOLTAR PARA O JOGO</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 320,
    backgroundColor: '#000',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
    position: 'relative',
  },
  fullScreenContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    height: '100%',
    zIndex: 1000,
    borderWidth: 0,
  },
  camera: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 15,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rightControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 10, paddingVertical: 5, 
    borderRadius: 20, gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  
  selector: { 
    flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.7)', 
    borderRadius: 20, padding: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' 
  },
  selectorBtn: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 18 },
  selectorBtnActive: { backgroundColor: COLORS.accent },
  selectorText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

  iconBtn: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },

  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  varBtn: { alignItems: 'center', gap: 2 },
  varText: { color: COLORS.accent, fontSize: 10, fontWeight: '900' },

  mainClipBtn: { alignItems: 'center', gap: 5 },
  clipIconBg: {
    backgroundColor: COLORS.accent,
    width: 64, height: 64, borderRadius: 32,
    justifyContent: 'center', alignItems: 'center',
    elevation: 10, shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8,
  },
  mainClipText: { color: '#FFF', fontSize: 11, fontWeight: '900', textShadowColor: '#000', textShadowRadius: 4 },

  permissionBtn: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  permissionText: { color: COLORS.accent, fontWeight: 'bold', fontSize: 16 },

  // Replay Modal (VAR)
  replayModalBg: { flex: 1, backgroundColor: '#060B18' },
  replayHeader: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    padding: 20, paddingTop: 50 
  },
  replayTitle: { color: COLORS.accent, fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  replayContent: { flex: 1, backgroundColor: '#000' },
  fullVideo: { flex: 1 },
  resumeBtn: { backgroundColor: COLORS.accent, padding: 20, alignItems: 'center' },
  resumeBtnText: { color: '#060B18', fontWeight: '900', fontSize: 16 },
  
  varToast: {
    position: 'absolute',
    top: 60, alignSelf: 'center',
    backgroundColor: COLORS.accent,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 25, elevation: 15,
    shadowColor: COLORS.accent, shadowOpacity: 0.8, shadowRadius: 10,
  },
  varToastText: { color: '#060B18', fontWeight: '900', fontSize: 10, letterSpacing: 1 },
  
  varBadge: {
    position: 'absolute', top: -5, right: -5,
    backgroundColor: COLORS.error, paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 10, zIndex: 10,
  },
  varBadgeText: { color: '#FFF', fontSize: 8, fontWeight: '900' },
});
