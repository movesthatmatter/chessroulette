import { GamePlayers, GameTimeClass, PendingGame } from './types';
import { PENDING_UNTIMED_GAME } from './state';
import { chessGameTimeLimitMsMap } from './constants';

export type CreatePendingGameParams = {
  timeClass: GameTimeClass;
  players: GamePlayers;
};

export const createPendingGame = ({
  timeClass,
  players,
}: CreatePendingGameParams): PendingGame => {
  const timeLeft = chessGameTimeLimitMsMap[timeClass];

  return {
    ...PENDING_UNTIMED_GAME,
    timeClass,
    timeLeft: {
      lastUpdatedAt: null,
      w: timeLeft,
      b: timeLeft,
    },
    players,
  };
};
