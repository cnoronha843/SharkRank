/**
 * SharkRank — Sync Service
 * Gerencia a fila de sincronização offline-first.
 * Usa WatermelonDB no nativo e AsyncStorage como fallback no web.
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = __DEV__ ? 'http://localhost:8000' : 'https://api.sharkrank.com.br';
const SYNC_KEY = '@sharkrank:sync_queue';

interface QueueItem {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT';
  payload: string;
  retryCount: number;
  status: string;
  createdAt: string;
}

// === ASYNC STORAGE FALLBACK (Web + simple mode) ===

async function getQueue(): Promise<QueueItem[]> {
  const raw = await AsyncStorage.getItem(SYNC_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveQueue(queue: QueueItem[]): Promise<void> {
  await AsyncStorage.setItem(SYNC_KEY, JSON.stringify(queue));
}

/**
 * Adiciona uma requisição à fila de sync.
 */
export async function enqueueSync(
  endpoint: string,
  method: 'POST' | 'PUT',
  payload: object,
): Promise<void> {
  const queue = await getQueue();
  queue.push({
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
    endpoint,
    method,
    payload: JSON.stringify(payload),
    retryCount: 0,
    status: 'pending',
    createdAt: new Date().toISOString(),
  });
  await saveQueue(queue);
}

/**
 * Processa todos os itens pendentes na fila.
 */
export async function processSyncQueue(): Promise<{
  processed: number;
  failed: number;
  remaining: number;
}> {
  const queue = await getQueue();
  let processed = 0;
  let failed = 0;
  const remaining: QueueItem[] = [];

  for (const item of queue) {
    if (item.status !== 'pending') {
      remaining.push(item);
      continue;
    }

    try {
      const response = await fetch(`${API_BASE}${item.endpoint}`, {
        method: item.method,
        headers: { 'Content-Type': 'application/json' },
        body: item.payload,
        signal: AbortSignal.timeout(15000),
      });

      if (response.ok) {
        processed++;
        // Não adicionamos ao remaining = removido da fila
      } else if (response.status === 409) {
        remaining.push({ ...item, status: 'failed', retryCount: item.retryCount + 1 });
        failed++;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error: any) {
      const newRetry = item.retryCount + 1;
      remaining.push({
        ...item,
        status: newRetry >= 3 ? 'failed' : 'pending',
        retryCount: newRetry,
      });
      failed++;
    }
  }

  await saveQueue(remaining);
  return {
    processed,
    failed,
    remaining: remaining.filter(r => r.status === 'pending' || r.status === 'failed').length,
  };
}

/**
 * Retorna contagem de itens na fila.
 */
export async function getSyncQueueStats(): Promise<{
  pending: number;
  failed: number;
  total: number;
}> {
  const queue = await getQueue();
  const pending = queue.filter(i => i.status === 'pending').length;
  const failedCount = queue.filter(i => i.status === 'failed').length;
  return { pending, failed: failedCount, total: queue.length };
}

/**
 * Limpa toda a fila.
 */
export async function clearSyncQueue(): Promise<void> {
  await AsyncStorage.removeItem(SYNC_KEY);
}
