/**
 * SharkRank — Sync Service
 * Gerencia a fila de sincronização offline-first.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Hardcoded IP para consistência com api.ts
const API_BASE = 'http://192.168.0.138:8000';
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

async function getQueue(): Promise<QueueItem[]> {
  const raw = await AsyncStorage.getItem(SYNC_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveQueue(queue: QueueItem[]): Promise<void> {
  await AsyncStorage.setItem(SYNC_KEY, JSON.stringify(queue));
}

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
      });

      if (response.ok) {
        processed++;
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

export async function clearSyncQueue(): Promise<void> {
  await AsyncStorage.removeItem(SYNC_KEY);
}
