/**
 * SharkRank — Motor ELO Simplificado (Mobile)
 * Decisão #1: Roda localmente para feedback instantâneo.
 * Configurável via elo_config_v{N}.json do backend.
 */

export interface ELOConfig {
  version: string;
  params: {
    base_rating: number;
    k_factor_rules: Array<{ max_matches: number; k: number }>;
  };
}

// Config padrão embutida (fallback se o backend não responder)
const DEFAULT_CONFIG: ELOConfig = {
  version: 'v1',
  params: {
    base_rating: 1500,
    k_factor_rules: [
      { max_matches: 10, k: 40 },
      { max_matches: 30, k: 24 },
      { max_matches: 999999, k: 16 },
    ],
  },
};

let currentConfig: ELOConfig = DEFAULT_CONFIG;

export function setELOConfig(config: ELOConfig): void {
  currentConfig = config;
}

export function getELOConfig(): ELOConfig {
  return currentConfig;
}

export function getKFactor(matchesPlayed: number): number {
  const rules = currentConfig.params.k_factor_rules;
  for (const rule of rules) {
    if (matchesPlayed <= rule.max_matches) {
      return rule.k;
    }
  }
  return 16; // fallback
}

/**
 * Calcula ELO provisório (simplificado — sem pesos de fundamentos).
 * O resultado é exibido com badge "✓ Provisório".
 */
export function calculateProvisionalELO(
  playerRating: number,
  opponentAvgRating: number,
  won: boolean,
  matchesPlayed: number,
): number {
  const k = getKFactor(matchesPlayed);
  const expected = 1.0 / (1.0 + Math.pow(10, (opponentAvgRating - playerRating) / 400.0));
  const actual = won ? 1.0 : 0.0;
  return Math.round((playerRating + k * (actual - expected)) * 10) / 10;
}

/**
 * Calcula ELO provisório para todos os jogadores de uma partida.
 */
export function calculateMatchProvisionalELO(
  teamA: string[],
  teamB: string[],
  ratings: Record<string, number>,
  matchCounts: Record<string, number>,
  teamAWon: boolean,
): Record<string, number> {
  const avgA = teamA.reduce((s, p) => s + (ratings[p] || 1500), 0) / teamA.length;
  const avgB = teamB.reduce((s, p) => s + (ratings[p] || 1500), 0) / teamB.length;

  const result: Record<string, number> = {};

  for (const pid of teamA) {
    result[pid] = calculateProvisionalELO(
      ratings[pid] || 1500, avgB, teamAWon, matchCounts[pid] || 0,
    );
  }
  for (const pid of teamB) {
    result[pid] = calculateProvisionalELO(
      ratings[pid] || 1500, avgA, !teamAWon, matchCounts[pid] || 0,
    );
  }

  return result;
}
