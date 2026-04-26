import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FAT_FINGER } from '../theme';
import { RadarChart } from './RadarChart';

interface Props {
  player: any;
  stats: any;
  radarData: any[];
  arenaName: string;
}

export function ShareCard({ player, stats, radarData, arenaName }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>🦈 SHARKRANK</Text>
        <Text style={styles.arena}>{arenaName.toUpperCase()}</Text>
      </View>

      <View style={styles.main}>
        <Text style={styles.emoji}>🏆</Text>
        <Text style={styles.name}>{player.name}</Text>
        <Text style={styles.elo}>{player.rating} ELO</Text>

        <RadarChart data={radarData} size={280} />

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statVal}>{player.matches_played}</Text>
            <Text style={styles.statLabel}>PARTIDAS</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statVal, {color: COLORS.success}]}>
              {stats?.wins || 0}
            </Text>
            <Text style={styles.statLabel}>VITÓRIAS</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statVal}>
              {Math.round(((stats?.wins || 0) / (player.matches_played || 1)) * 100)}%
            </Text>
            <Text style={styles.statLabel}>WIN RATE</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Acompanhe meu ranking no App SharkRank</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 400,
    height: 711, // 9:16 ratio approx
    backgroundColor: COLORS.bgPrimary,
    padding: 40,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.accent,
    letterSpacing: 2,
  },
  arena: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 4,
    letterSpacing: 1,
  },
  main: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 10,
  },
  name: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  elo: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.accent,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 30,
  },
  stat: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 8,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});
