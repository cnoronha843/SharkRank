/**
 * SharkRank — API Service
 * Comunicação com o backend FastAPI.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Hardcoded IP para evitar falhas de carregamento de .env no dispositivo físico
const API_BASE = 'http://192.168.0.138:8000';

const SYNC_QUEUE_KEY = '@sharkrank:sync_queue';

interface QueuedRequest {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT';
  body: any;
  createdAt: string;
}

/**
 * Fetch wrapper com timeout e error handling.
 */
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

// === PUBLIC API ===

export const api = {
  health: () => apiFetch<{ status: string }>('/health'),

  getELOConfig: () => apiFetch<any>('/elo/config'),

  getArenaRanking: (arenaId: string) =>
    apiFetch<any>(`/arenas/${arenaId}/ranking`),

  getArenaPlayers: (arena_id: string) =>
    apiFetch<any>(`/arenas/${arena_id}/players`),

  getCalibrationReport: (arena_id: string) =>
    apiFetch<any>(`/arenas/${arena_id}/calibration-report`),

  getPlayerStats: (player_id: string) =>
    apiFetch<any>(`/players/${player_id}/stats`),

  getPlayerMatches: (player_id: string) =>
    apiFetch<any>(`/players/${player_id}/matches`),
};
