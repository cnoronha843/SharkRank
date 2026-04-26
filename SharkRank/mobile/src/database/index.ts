/**
 * SharkRank — Database Initialization
 * WatermelonDB com SQLite para iOS/Android.
 * Para Web (preview/demo), usa fallback sem database.
 */

import { Platform } from 'react-native';

import {
  PlayerModel,
  MatchModel,
  MatchEventModel,
  ELOHistoryModel,
  SyncQueueModel,
  CalibrationSurveyModel,
} from './models';

let database: any = null;

// WatermelonDB só funciona em iOS/Android (SQLite nativo)
// Em web, o sync service usa AsyncStorage como fallback
if (Platform.OS !== 'web') {
  try {
    const { Database } = require('@nozbe/watermelondb');
    const SQLiteAdapter = require('@nozbe/watermelondb/adapters/sqlite').default;
    const { sharkRankSchema } = require('./schema');

    const adapter = new SQLiteAdapter({
      schema: sharkRankSchema,
      dbName: 'sharkrank',
      jsi: true,
      onSetUpError: (error: any) => {
        console.error('[SharkRank DB] Setup error:', error);
      },
    });

    database = new Database({
      adapter,
      modelClasses: [
        PlayerModel,
        MatchModel,
        MatchEventModel,
        ELOHistoryModel,
        SyncQueueModel,
        CalibrationSurveyModel,
      ],
    });
  } catch (e) {
    console.warn('[SharkRank DB] WatermelonDB not available, using fallback');
  }
}

export { database };

export {
  PlayerModel,
  MatchModel,
  MatchEventModel,
  ELOHistoryModel,
  SyncQueueModel,
  CalibrationSurveyModel,
};
