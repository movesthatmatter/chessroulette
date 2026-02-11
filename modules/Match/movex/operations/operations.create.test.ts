import { chessGameTimeLimitMsMap } from '@/modules/Game/constants';
import { createMatchState } from './operations';
import { initialPlayState } from '../../Play/store';
import { MatchState } from '../types';
import { Game } from '@/modules/Game';

const CONSTANTS = {
  challengeeId: 'challengee-user',
  challengerId: 'challenger-user',
};

describe('Best Of', () => {
  test('with given rounds and color', () => {
    const actual = createMatchState({
      type: 'bestOf',
      rounds: 3,
      timeClass: 'blitz',
      challengeeId: CONSTANTS.challengeeId,
      challengerId: CONSTANTS.challengerId,
      startColor: 'b',
    });

    const expectedGameInPlay: Game = {
      ...initialPlayState,
      timeClass: 'blitz',

      timeLeft: {
        lastUpdatedAt: initialPlayState.lastMoveAt,
        b: chessGameTimeLimitMsMap.blitz,
        w: chessGameTimeLimitMsMap.blitz,
      },

      players: {
        w: CONSTANTS.challengeeId,
        b: CONSTANTS.challengerId,
      },
    };

    const expected: MatchState = {
      status: 'pending',
      type: 'bestOf',
      rounds: 3,

      winner: null,
      endedGames: [],
      gameInPlay: expectedGameInPlay,
      challengee: {
        points: 0,
        id: CONSTANTS.challengeeId,
      },
      challenger: {
        points: 0,
        id: CONSTANTS.challengerId,
      },

      // Defaults
      timeToAbortMs: actual.timeToAbortMs,
      breakDurationMs: actual.breakDurationMs,
    };

    expect(actual).toEqual(expected);
  });
});

describe('Open Ended', () => {
  test('with given rounds and color', () => {
    const actual = createMatchState({
      type: 'openEnded',
      timeClass: 'bullet',
      challengeeId: CONSTANTS.challengeeId,
      challengerId: CONSTANTS.challengerId,
      startColor: 'b',
    });

    const expectedGameInPlay: Game = {
      ...initialPlayState,
      timeClass: 'bullet',

      timeLeft: {
        lastUpdatedAt: initialPlayState.lastMoveAt,
        b: chessGameTimeLimitMsMap.bullet,
        w: chessGameTimeLimitMsMap.bullet,
      },

      players: {
        w: CONSTANTS.challengeeId,
        b: CONSTANTS.challengerId,
      },
    };

    const expected: MatchState = {
      status: 'pending',
      type: 'openEnded',
      winner: null,
      endedGames: [],
      gameInPlay: expectedGameInPlay,
      challengee: {
        points: 0,
        id: CONSTANTS.challengeeId,
      },
      challenger: {
        points: 0,
        id: CONSTANTS.challengerId,
      },

      // Defaults
      timeToAbortMs: actual.timeToAbortMs,
      breakDurationMs: actual.breakDurationMs,
    };

    expect(actual).toEqual(expected);
  });
});
