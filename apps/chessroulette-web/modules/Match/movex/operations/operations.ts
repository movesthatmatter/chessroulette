import { getRandomColor } from '@xmatter/util-kit';
import { MatchState } from '../types';
import { createPendingGame } from '../../Play/store';
import { CreateMatchParamsSchema } from './operationsSchemas';

export const createMatchState = (
  params: CreateMatchParamsSchema
): NonNullable<MatchState> => {
  const challengerColor = params.startColor || getRandomColor();

  return {
    status: 'pending',
    ...(params.type === 'bestOf'
      ? {
          type: params.type,
          rounds: params.rounds || 1, // Default to one round if not specified
        }
      : {
          type: params.type,
        }),
    challengee: {
      id: params.challengeeId,
      points: 0,
    },
    challenger: {
      id: params.challengerId,
      points: 0,
    },
    winner: null,
    endedGames: [],
    gameInPlay: createPendingGame({
      timeClass: params.timeClass || 'untimed',
      players:
        // TODO: here can also just leave the ids as "challenger" & "challengee"
        challengerColor === 'white'
          ? {
              white: params.challengerId,
              black: params.challengeeId,
            }
          : {
              white: params.challengeeId,
              black: params.challengerId,
            },
    }),
    timeToAbortMs: params.timeToAbortMs || 3 * 60 * 1000, // default to 3 mins
    breakDurationMs: params.breakDurationMs || 10 * 1000, // deafult ot 10 seconds
  };
};
