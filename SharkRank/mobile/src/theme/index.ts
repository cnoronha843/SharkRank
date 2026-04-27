/**
 * SharkRank — Design System & Theme
 * Paleta ocean/shark dark com contraste WCAG AAA para uso sob sol direto.
 * Conforme PRD v2.0, Seção 3 (High-Contrast Mode).
 */

export const COLORS = {
  bgPrimary: '#060B18', // Deep Night
  bgSecondary: '#0F172A', // Slate Dark
  bgTertiary: '#1E293B',
  bgCard: 'rgba(30, 41, 59, 0.7)', // Glassmorphism support
  accent: '#00D4FF', // Shark Cyan
  accentBlue: '#0066FF',
  accentOrange: '#FF8A00', // Court Orange

  // Text (WCAG AAA: ratio ≥7:1 contra bgPrimary)
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',

  // Semantic
  success: '#10B981',
  error: '#EF4444',
  warning: '#FFD740',

  // Tier colors
  tierShark: '#00D4FF',
  tierDiamante: '#B388FF',
  tierOuro: '#FFD54F',
  tierPrata: '#B0BEC5',
  tierBronze: '#BCAAA4',
  tierPeixe: '#80CBC4',

  // Borders
  border: 'rgba(0, 212, 255, 0.08)',
  borderActive: 'rgba(0, 212, 255, 0.3)',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  hero: 32,
} as const;

export const FONT_WEIGHTS = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const BORDER_RADIUS = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  full: 999,
} as const;

/**
 * Dimensões fat-finger conforme Decisão #2 da Reunião de Alinhamento:
 * minHeight: 72dp, padding: 8dp entre botões.
 */
export const FAT_FINGER = {
  minHeight: 72,
  gap: 8,
} as const;

/**
 * Tier do sistema de ranking ELO.
 */
export interface Tier {
  name: string;
  emoji: string;
  min: number;
  max: number;
  color: string;
}

export const TIERS: Tier[] = [
  { name: 'Ouro', emoji: '🥇', min: 2000, max: 9999, color: COLORS.tierOuro },
  { name: 'Prata', emoji: '🥈', min: 1800, max: 1999, color: COLORS.tierPrata },
  { name: 'Bronze', emoji: '🥉', min: 1600, max: 1799, color: COLORS.tierBronze },
  { name: 'Intermediário', emoji: '⚡', min: 1400, max: 1599, color: COLORS.tierDiamante },
  { name: 'Iniciante', emoji: '🌱', min: 1200, max: 1399, color: COLORS.tierPeixe },
  { name: 'Estreante', emoji: '🥚', min: 0, max: 1199, color: COLORS.textMuted },
];

export function getTier(rating: number): Tier {
  return TIERS.find(t => rating >= t.min && rating <= t.max) || TIERS[TIERS.length - 1];
}

export const FUNDAMENTOS = [
  { key: 'coxa', label: 'Coxa', emoji: '🦵', testID: 'sr_btn_coxa', isError: false },
  { key: 'peito', label: 'Peito', emoji: '🛡️', testID: 'sr_btn_peito', isError: false },
  { key: 'ombro', label: 'Ombro', emoji: '💪', testID: 'sr_btn_ombro', isError: false },
  { key: 'chapa', label: 'Chapa', emoji: '🦶', testID: 'sr_btn_chapa', isError: false },
  { key: 'cabeca', label: 'Cabeça', emoji: '👤', testID: 'sr_btn_cabeca', isError: false },
  { key: 'shark_ataque', label: 'Shark Ataque', emoji: '🦈', testID: 'sr_btn_shark', isError: false },
  { key: 'erro_saque', label: 'Erro Saque', emoji: '❌', testID: 'sr_btn_err_saq', isError: true },
  { key: 'erro_recepcao', label: 'Erro Recepção', emoji: '❌', testID: 'sr_btn_err_rec', isError: true },
  { key: 'erro_ataque', label: 'Erro Ataque', emoji: '❌', testID: 'sr_btn_err_atk', isError: true },
  { key: 'erro_segunda', label: 'Erro 2ª Bola', emoji: '🚫', testID: 'sr_btn_err_seg', isError: true },
] as const;
