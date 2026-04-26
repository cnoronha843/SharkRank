/**
 * SharkRank — Formulário Pós-Treino (Shadow Mode)
 * Decisão #3 / ProductOwner.md: 3 perguntas objetivas após cada sessão.
 * Dados de calibração ELO vs. percepção do professor.
 */

import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme';
import { enqueueSync } from '../services/sync';

interface SurveyProps {
  matchId: string;
  arenaId: string;
  onComplete: () => void;
  onSkip: () => void;
}

export function CalibrationSurvey({ matchId, arenaId, onComplete, onSkip }: SurveyProps) {
  const [q1, setQ1] = useState<number | null>(null);    // 1-5 accuracy
  const [q2, setQ2] = useState('');                       // best player
  const [q3, setQ3] = useState<string | null>(null);     // would use

  const canSubmit = q1 !== null && q3 !== null;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    const survey = {
      arena_id: arenaId,
      match_id: matchId,
      q1_accuracy_score: q1,
      q2_best_player: q2.trim() || 'N/A',
      q3_would_use: q3,
      created_at: new Date().toISOString(),
    };

    await enqueueSync('/calibration-surveys', 'POST', survey);
    onComplete();
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>🔬 Calibração Rápida</Text>
        <Text style={styles.subtitle}>Ajude-nos a calibrar o motor de nivelamento</Text>

        {/* Q1: Precisão (1-5) */}
        <View style={styles.question}>
          <Text style={styles.qLabel}>
            1. Quão precisa foi a avaliação dos seus alunos hoje?
          </Text>
          <View style={styles.scaleRow}>
            {[1, 2, 3, 4, 5].map(n => (
              <TouchableOpacity
                key={n}
                testID={`sr_btn_q1_${n}`}
                style={[styles.scaleBtn, q1 === n && styles.scaleBtnActive]}
                onPress={() => setQ1(n)}
              >
                <Text style={[styles.scaleBtnText, q1 === n && styles.scaleBtnTextActive]}>
                  {n}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.scaleLabels}>
            <Text style={styles.scaleLabelText}>Imprecisa</Text>
            <Text style={styles.scaleLabelText}>Perfeita</Text>
          </View>
        </View>

        {/* Q2: Melhor jogador */}
        <View style={styles.question}>
          <Text style={styles.qLabel}>
            2. Qual aluno jogou melhor nesta sessão?
          </Text>
          <TextInput
            testID="sr_input_q2"
            style={styles.input}
            placeholder="Nome do aluno..."
            placeholderTextColor={COLORS.textMuted}
            value={q2}
            onChangeText={setQ2}
          />
        </View>

        {/* Q3: Usaria o app */}
        <View style={styles.question}>
          <Text style={styles.qLabel}>
            3. Você usaria este app para dar nota oficial aos seus alunos?
          </Text>
          <View style={styles.optionRow}>
            {(['Sim', 'Talvez', 'Não'] as const).map(opt => (
              <TouchableOpacity
                key={opt}
                testID={`sr_btn_q3_${opt.toLowerCase()}`}
                style={[styles.optionBtn, q3 === opt && styles.optionBtnActive]}
                onPress={() => setQ3(opt)}
              >
                <Text style={[styles.optionBtnText, q3 === opt && styles.optionBtnTextActive]}>
                  {opt === 'Sim' ? '👍' : opt === 'Não' ? '👎' : '🤔'} {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity
          testID="sr_btn_survey_submit"
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          <Text style={styles.submitBtnText}>Enviar Feedback</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
          <Text style={styles.skipBtnText}>Pular por agora</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: SPACING.md, backgroundColor: COLORS.bgPrimary },
  card: {
    backgroundColor: COLORS.bgSecondary, borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, padding: SPACING.xl,
  },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center' },
  subtitle: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center', marginTop: 4, marginBottom: SPACING.xl },
  question: { marginBottom: SPACING.xl },
  qLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: SPACING.md, lineHeight: 20 },
  scaleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.sm },
  scaleBtn: {
    flex: 1, height: 48, borderRadius: BORDER_RADIUS.sm, backgroundColor: COLORS.bgTertiary,
    borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center',
  },
  scaleBtnActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  scaleBtnText: { fontSize: 18, fontWeight: '700', color: COLORS.textSecondary },
  scaleBtnTextActive: { color: COLORS.bgPrimary },
  scaleLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  scaleLabelText: { fontSize: 10, color: COLORS.textMuted },
  input: {
    backgroundColor: COLORS.bgTertiary, borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md,
    color: COLORS.textPrimary, fontSize: 14,
  },
  optionRow: { flexDirection: 'row', gap: SPACING.sm },
  optionBtn: {
    flex: 1, paddingVertical: 12, borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center',
  },
  optionBtnActive: { borderColor: COLORS.accent, backgroundColor: 'rgba(0, 212, 255, 0.1)' },
  optionBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  optionBtnTextActive: { color: COLORS.accent },
  submitBtn: {
    backgroundColor: COLORS.accent, paddingVertical: 14, borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center', marginBottom: SPACING.md,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.bgPrimary },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipBtnText: { fontSize: 13, color: COLORS.textMuted },
});
