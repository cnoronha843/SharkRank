/**
 * SharkRank — WatermelonDB Models (Decorator-free)
 * Usa a API funcional do WatermelonDB para compatibilidade com Babel/Web.
 * Espelham o schema PostgreSQL do backend.
 */

import { Model } from '@nozbe/watermelondb';

// === PLAYER MODEL ===
export class PlayerModel extends Model {
  static table = 'players';
}

// === MATCH MODEL ===
export class MatchModel extends Model {
  static table = 'matches';

  get teamA(): string[] {
    try { return JSON.parse((this as any).teamAIds || '[]'); } catch { return []; }
  }

  get teamB(): string[] {
    try { return JSON.parse((this as any).teamBIds || '[]'); } catch { return []; }
  }
}

// === MATCH EVENT MODEL ===
export class MatchEventModel extends Model {
  static table = 'match_events';
}

// === ELO HISTORY MODEL ===
export class ELOHistoryModel extends Model {
  static table = 'elo_history';
}

// === SYNC QUEUE MODEL ===
export class SyncQueueModel extends Model {
  static table = 'sync_queue';
}

// === CALIBRATION SURVEY MODEL ===
export class CalibrationSurveyModel extends Model {
  static table = 'calibration_surveys';
}
