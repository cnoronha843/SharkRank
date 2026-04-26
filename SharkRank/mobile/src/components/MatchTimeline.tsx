import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme';

interface Match {
  match_id: string;
  score_a: number;
  score_b: number;
  team_a: string[];
  team_b: string[];
  created_at: string;
}

interface Props {
  matches: Match[];
  playerId: string;
}

export function MatchTimeline({ matches, playerId }: Props) {
  if (matches.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Nenhuma partida registrada recentemente.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Histórico de Partidas</Text>
      {matches.map((item) => {
        const isTeamA = item.team_a.includes(playerId);
        const won = isTeamA ? item.score_a > item.score_b : item.score_b > item.score_a;
        const date = new Date(item.created_at).toLocaleDateString('pt-BR');

        return (
          <View key={item.match_id} style={styles.matchCard}>
            <View style={[styles.statusIndicator, { backgroundColor: won ? COLORS.success : COLORS.error }]} />
            <View style={styles.matchInfo}>
              <Text style={styles.matchDate}>{date}</Text>
              <Text style={styles.matchScore}>
                {item.score_a} - {item.score_b}
              </Text>
            </View>
            <View style={styles.resultBadge}>
              <Text style={[styles.resultText, { color: won ? COLORS.success : COLORS.error }]}>
                {won ? 'VITÓRIA' : 'DERROTA'}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', marginTop: 20 },
  title: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 12 },
  matchCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgTertiary,
    borderRadius: BORDER_RADIUS.sm, padding: SPACING.md, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  statusIndicator: { width: 4, height: '100%', borderRadius: 2, marginRight: 12 },
  matchInfo: { flex: 1 },
  matchDate: { fontSize: 10, color: COLORS.textMuted, marginBottom: 2 },
  matchScore: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  resultBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.05)' },
  resultText: { fontSize: 10, fontWeight: '900' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: COLORS.textMuted, fontSize: 12 },
});
