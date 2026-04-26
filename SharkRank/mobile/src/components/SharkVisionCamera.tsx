import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { COLORS, BORDER_RADIUS } from '../theme';

export interface SharkVisionHandle {
  startRecording: () => Promise<string | null>;
  stopRecording: () => void;
}

export const SharkVisionCamera = forwardRef<SharkVisionHandle>((props, ref) => {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const recordingPromise = useRef<Promise<any> | null>(null);

  useImperativeHandle(ref, () => ({
    startRecording: async () => {
      if (cameraRef.current && !isRecording) {
        try {
          setIsRecording(true);
          recordingPromise.current = cameraRef.current.recordAsync({
            maxDuration: 30,
          });
          return "recording_started";
        } catch (e) {
          console.error("Start recording error", e);
          setIsRecording(false);
          return null;
        }
      }
      return null;
    },
    stopRecording: async () => {
      if (cameraRef.current && isRecording) {
        cameraRef.current.stopRecording();
        const result = await recordingPromise.current;
        setIsRecording(false);
        return result?.uri || null;
      }
      return null;
    }
  }));


  if (!cameraPermission || !micPermission) {
    return <View style={styles.container} />;
  }

  if (!cameraPermission.granted || !micPermission.granted) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => { requestCameraPermission(); requestMicPermission(); }}>
          <Text style={styles.text}>Liberar Câmera SharkVision</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        ref={cameraRef}
        mode="video"
        facing="back"
      >
        <View style={styles.overlay}>
          {isRecording && <View style={styles.recordingIndicator} />}
          <Text style={styles.brand}>SHARKVISION AI ACTIVE</Text>
        </View>
      </CameraView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 200,
    backgroundColor: '#000',
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: 10,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  brand: {
    fontSize: 8,
    color: COLORS.accent,
    fontWeight: 'bold',
    opacity: 0.7,
  },
  recordingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
  text: {
    color: '#fff',
    fontSize: 12,
  }
});
