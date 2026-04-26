/**
 * SharkRank — Feature Flags
 * Decisão #3: SHADOW_MODE controla visibilidade do ELO.
 * Configurável remotamente via PostHog/Firebase no futuro.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const FLAGS_KEY = '@sharkrank:feature_flags';

export interface FeatureFlags {
  SHADOW_MODE: boolean;        // ELO calcula mas NÃO exibe ranking
  EXTRA_FUNDAMENTOS: boolean;  // Bloqueio + Levantamento (Fase 1.5)
  SHOW_SURVEY: boolean;        // Formulário pós-treino ativo
  DEBUG_MODE: boolean;         // Logs verbosos
}

const DEFAULT_FLAGS: FeatureFlags = {
  SHADOW_MODE: true,           // Ativo por padrão na fase beta
  EXTRA_FUNDAMENTOS: false,    // Desativado no MVP
  SHOW_SURVEY: true,           // Ativo para coleta de calibração
  DEBUG_MODE: __DEV__,
};

let _flags: FeatureFlags = { ...DEFAULT_FLAGS };

export async function loadFlags(): Promise<FeatureFlags> {
  try {
    const raw = await AsyncStorage.getItem(FLAGS_KEY);
    if (raw) _flags = { ...DEFAULT_FLAGS, ...JSON.parse(raw) };
  } catch {}
  return _flags;
}

export async function setFlag<K extends keyof FeatureFlags>(key: K, value: FeatureFlags[K]): Promise<void> {
  _flags[key] = value;
  await AsyncStorage.setItem(FLAGS_KEY, JSON.stringify(_flags));
}

export function getFlag<K extends keyof FeatureFlags>(key: K): FeatureFlags[K] {
  return _flags[key];
}

export function getAllFlags(): FeatureFlags {
  return { ..._flags };
}
