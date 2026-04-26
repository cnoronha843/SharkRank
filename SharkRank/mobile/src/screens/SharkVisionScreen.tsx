import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme';
import { Ionicons } from '@expo/vector-icons';

export function SharkVisionScreen() {
  const dummyVideos = [
    { id: '1', title: 'Rafa vs Matheus - Set 1', duration: '12:45', date: 'Hoje' },
    { id: '2', title: 'Carlão vs Lucas - Match Point', duration: '01:20', date: 'Ontem' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="videocam" size={28} color={COLORS.accent} />
        <Text style={styles.title}>SharkVision</Text>
      </View>
      <Text style={styles.subtitle}>Galeria de Replays e Destaques</Text>

      <FlatList
        data={dummyVideos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.videoCard}>
            <View style={styles.thumbnail}>
              <Ionicons name="play-circle" size={48} color="rgba(255,255,255,0.8)" />
              <Text style={styles.duration}>{item.duration}</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.videoTitle}>{item.title}</Text>
              <Text style={styles.videoDate}>{item.date}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginBottom: 30,
  },
  videoCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  thumbnail: {
    height: 160,
    backgroundColor: '#1E2530',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  duration: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cardInfo: {
    padding: 15,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  videoDate: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
});
