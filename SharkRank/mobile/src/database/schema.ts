/**
 * SharkRank — WatermelonDB Schema
 * Conforme PRD v2.0: WatermelonDB é a escolha definitiva (AsyncStorage descartado).
 * Define o schema local espelhando as tabelas do PostgreSQL.
 */

import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const sharkRankSchema = appSchema({
  version: 1,
  tables: [
    // === PLAYERS (cache local) ===
    tableSchema({
      name: 'players',
      columns: [
        { name: 'server_id', type: 'string' },
        { name: 'arena_id', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'nickname', type: 'string', isOptional: true },
        { name: 'position', type: 'string' },
        { name: 'rating', type: 'number' },
        { name: 'matches_played', type: 'number' },
        { name: 'wins', type: 'number' },
        { name: 'is_synced', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // === MATCHES (criadas offline, sincronizadas depois) ===
    tableSchema({
      name: 'matches',
      columns: [
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'arena_id', type: 'string' },
        { name: 'team_a_ids', type: 'string' },  // JSON stringified array
        { name: 'team_b_ids', type: 'string' },
        { name: 'score_a', type: 'number' },
        { name: 'score_b', type: 'number' },
        { name: 'sets_data', type: 'string' },  // JSON stringified
        { name: 'elo_provisional', type: 'string' },  // JSON stringified
        { name: 'elo_definitive', type: 'string', isOptional: true },
        { name: 'elo_config_version', type: 'string' },
        { name: 'is_synced', type: 'boolean' },
        { name: 'sync_error', type: 'string', isOptional: true },
        { name: 'played_at', type: 'number' },
        { name: 'synced_at', type: 'number', isOptional: true },
      ],
    }),

    // === MATCH EVENTS (fundamentos registrados) ===
    tableSchema({
      name: 'match_events',
      columns: [
        { name: 'match_id', type: 'string' },
        { name: 'player_id', type: 'string' },
        { name: 'set_number', type: 'number' },
        { name: 'event_type', type: 'string' },  // saque_ace, recepcao_perfeita, etc.
        { name: 'event_timestamp', type: 'number' },
      ],
    }),

    // === ELO HISTORY (evolução local) ===
    tableSchema({
      name: 'elo_history',
      columns: [
        { name: 'player_id', type: 'string' },
        { name: 'match_id', type: 'string' },
        { name: 'rating_before', type: 'number' },
        { name: 'rating_after', type: 'number' },
        { name: 'delta', type: 'number' },
        { name: 'is_provisional', type: 'boolean' },  // true = mobile, false = reconciliado
        { name: 'created_at', type: 'number' },
      ],
    }),

    // === SYNC QUEUE (fila de sincronização offline-first) ===
    tableSchema({
      name: 'sync_queue',
      columns: [
        { name: 'endpoint', type: 'string' },
        { name: 'method', type: 'string' },
        { name: 'payload', type: 'string' },  // JSON stringified
        { name: 'retry_count', type: 'number' },
        { name: 'last_error', type: 'string', isOptional: true },
        { name: 'status', type: 'string' },  // pending, processing, failed
        { name: 'created_at', type: 'number' },
      ],
    }),

    // === CALIBRATION SURVEYS (Shadow Mode — formulário pós-treino) ===
    tableSchema({
      name: 'calibration_surveys',
      columns: [
        { name: 'arena_id', type: 'string' },
        { name: 'match_id', type: 'string' },
        { name: 'q1_accuracy', type: 'number' },
        { name: 'q2_best_player', type: 'string' },
        { name: 'q3_would_use', type: 'string' },
        { name: 'is_synced', type: 'boolean' },
        { name: 'created_at', type: 'number' },
      ],
    }),
  ],
});
