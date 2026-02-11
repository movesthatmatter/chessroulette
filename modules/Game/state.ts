import { PendingGame } from './types';

export const PENDING_UNTIMED_GAME: PendingGame = {
  status: 'pending',
  winner: null,
  startedAt: null,
  pgn: '',
  timeLeft: {
    lastUpdatedAt: null,
    w: 0,
    b: 0,
  },
  lastMoveBy: 'b',
  lastMoveAt: null,
  timeClass: 'untimed',
  gameOverReason: null,

  // TODO: This doesn't need to be an array and it doesn't need to be always defined
  offers: [],

  players: {
    w: 'N/A',
    b: 'N/A',
  },
};
