/**
 * SharkRank — API Service
 * Comunicação com o backend FastAPI.
 * Inclui sync queue para offline-first (Decisão #1).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Pegamos a URL da rede local (se configurado no .env) ou cai no localhost se for web
const API_BASE = process.env.EXPO_PUBLIC_API_URL || (__DEV__ ? 'http://localhost:8000' : 'https://api.sharkrank.com.br');

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

  getArenaPlayers: (arenaId: string) =>
    apiFetch<any>(`/arenas/${arenaId}/players`),

  getCalibrationReport: (arenaId: string) =>
    apiFetch<any>(`/arenas/${arenaId}/calibration-report`),

  submitMatch: (matchData: any) =>
    apiFetch<any>('/matches', {
      method: 'POST',
      body: JSON.stringify(matchData),
    }),

  getELOAccuracy: () => apiFetch<any>('/health/elo-accuracy'),
};

// === SYNC QUEUE (Offline-First) ===

export async function addToSyncQueue(request: Omit<QueuedRequest, 'id' | 'createdAt'>): Promise<void> {
  const queue = await getSyncQueue();
  queue.push({
    ...request,
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
    createdAt: new Date().toISOString(),
  });
  await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
}

export async function getSyncQueue(): Promise<QueuedRequest[]> {
  const raw = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function processSyncQueue(): Promise<{ processed: number; failed: number }> {
  const queue = await getSyncQueue();
  let processed = 0;
  let failed = 0;
  const remaining: QueuedRequest[] = [];

  for (const item of queue) {
    try {
      await apiFetch(item.endpoint, {
        method: item.method,
        body: JSON.stringify(item.body),
      });
      processed++;
    } catch (error) {
      failed++;
      remaining.push(item);
    }
  }

  await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remaining));
  return { processed, failed };
}

export async function clearSyncQueue(): Promise<void> {
  await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
}
