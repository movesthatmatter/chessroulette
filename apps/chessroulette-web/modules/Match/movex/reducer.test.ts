import {
  Game,
  GameTimeClass,
  OngoingGame,
} from '@app/modules/Game';
import { applyActionsToReducer } from '@app/lib/util';
import { GameOverReason, invoke } from '@xmatter/util-kit';
import { createMatchState } from './operations/operations';
import { reducer as matchReducer } from './reducer';
import { MatchState } from './types';
import { PlayActions, createPendingGame } from '../Play/store';
import { AnyAction, GetReducerAction, GetReducerState } from 'movex-core-util';

type CreateOngoingGameParams = {
  timeClass: GameTimeClass;
  lastMoveAt: number;
  startedAt: number;
  players?: Game['players'];
};

const CONSTANTS = {
  challengerId: 'challenger-user',
  challengeeId: 'challengee-user',

  get gamePlayersByColors(): Game['players'] {
    return {
      white: this.challengerId,
      black: this.challengeeId,
    };
  },

  get gamePlayersByColorsReversed(): Game['players'] {
    return {
      white: this.challengeeId,
      black: this.challengerId,
    };
  },

  ...invoke(() => {
    const { timeToAbortMs, breakDurationMs } = createMatchState({
      type: 'openEnded',
      challengerId: 'a',
      challengeeId: 'b',
    });

    return { timeToAbortMs, breakDurationMs };
  }),
};

const applyActionsToMatchReducer = (
  s: GetReducerState<typeof matchReducer>,
  actions: GetReducerAction<typeof matchReducer>[]
) => applyActionsToReducer(matchReducer, s, actions);

const createOngoingGame = ({
  timeClass,
  lastMoveAt,
  startedAt,
  players = CONSTANTS.gamePlayersByColors,
}: CreateOngoingGameParams): OngoingGame => {
  const pendingGame = createPendingGame({ timeClass, players });

  return {
    ...pendingGame,
    status: 'ongoing',
    startedAt,
    timeLeft: {
      ...pendingGame.timeLeft,
      lastUpdatedAt: lastMoveAt,
    },
    lastMoveAt,

    players,
  };
};

// TBD
// test('Match does NOT become "pending" if the game has NOT started yet', () => {});

describe('Match Status: Pending > Ongoing', () => {
  const matchCreateParams: Parameters<typeof createMatchState>[0] = {
    type: 'bestOf',
    rounds: 3,
    timeClass: 'blitz',
    challengeeId: CONSTANTS.challengeeId,
    challengerId: CONSTANTS.challengerId,
    startColor: 'b',
  };

  const pendingMatch = createMatchState(matchCreateParams);

  const idlingMatch = matchReducer(pendingMatch, {
    type: 'play:start',
    payload: {
      at: 123,
      players: CONSTANTS.gamePlayersByColors,
    },
  });

  test('With first move', () => {
    const actual = matchReducer(idlingMatch, {
      type: 'play:move',
      payload: { from: 'e2', to: 'e4', moveAt: 123 },
    });

    const expected: MatchState = {
      status: 'pending',
      type: 'bestOf',
      rounds: 3,
      endedGames: [],
      challenger: { id: CONSTANTS.challengerId, points: 0 },
      challengee: { id: CONSTANTS.challengeeId, points: 0 },
      winner: null,
      gameInPlay: {
        ...createPendingGame({
          timeClass: 'blitz',
          players: CONSTANTS.gamePlayersByColors,
          // challengerColor: 'b',
        }),
        status: 'idling',
        startedAt: 123,
        winner: null,
        pgn: '1. e4',
        lastMoveAt: 123,
        lastMoveBy: 'white',
        players: CONSTANTS.gamePlayersByColors,
      },

      // Defaults
      timeToAbortMs: CONSTANTS.timeToAbortMs,
      breakDurationMs: CONSTANTS.breakDurationMs,
    };

    expect(actual).toEqual(expected);

    const update = matchReducer(actual, {
      type: 'play:move',
      payload: { from: 'e7', to: 'e6', moveAt: 123 },
    });

    const expectedUpdate: MatchState = {
      status: 'ongoing',
      type: 'bestOf',
      rounds: 3,
      endedGames: [],
      challenger: { id: CONSTANTS.challengerId, points: 0 },
      challengee: { id: CONSTANTS.challengeeId, points: 0 },
      winner: null,
      gameInPlay: {
        ...createOngoingGame({
          timeClass: 'blitz',
          startedAt: 123,
          lastMoveAt: 123,
        }),
        status: 'ongoing',
        winner: null,
        pgn: '1. e4 e6',
        lastMoveBy: 'black',
      },

      // Defaults
      timeToAbortMs: CONSTANTS.timeToAbortMs,
      breakDurationMs: CONSTANTS.breakDurationMs,
    };

    expect(update).toEqual(expectedUpdate);
  });
});

describe('Match Status: Ongoing > Completed', () => {
  const matchCreateParams: Parameters<typeof createMatchState>[0] = {
    type: 'bestOf',
    rounds: 1,
    timeClass: 'blitz',
    challengeeId: CONSTANTS.challengeeId,
    challengerId: CONSTANTS.challengerId,
    startColor: 'w',
  };

  const pendingMatch = createMatchState(matchCreateParams);
  const idlingMatch = matchReducer(pendingMatch, {
    type: 'play:start',
    payload: {
      at: 123,
      players: CONSTANTS.gamePlayersByColors,
    },
  });

  test('On check mate move', () => {
    const actual = matchReducer(idlingMatch, {
      type: 'play:move',
      payload: { from: 'g2', to: 'g4', moveAt: 123 },
    });

    const expected: MatchState = {
      status: 'pending',
      type: 'bestOf',
      rounds: 1,
      endedGames: [],
      challenger: { id: CONSTANTS.challengerId, points: 0 },
      challengee: { id: CONSTANTS.challengeeId, points: 0 },
      winner: null,

      // Defaults
      timeToAbortMs: CONSTANTS.timeToAbortMs,
      breakDurationMs: CONSTANTS.breakDurationMs,
      gameInPlay: {
        ...createPendingGame({
          timeClass: 'blitz',
          players: CONSTANTS.gamePlayersByColors,
        }),
        status: 'idling',

        pgn: '1. g4',
        lastMoveAt: 123,
        lastMoveBy: 'white',
        startedAt: 123,
        winner: null,
      },
    };

    expect(actual).toEqual(expected);

    const actualUpdate = applyActionsToMatchReducer(actual, [
      {
        type: 'play:move',
        payload: { from: 'e7', to: 'e6', moveAt: 1234 },
      },
      {
        type: 'play:move',
        payload: { from: 'f2', to: 'f3', moveAt: 1234 },
      },
      {
        type: 'play:move',
        payload: { from: 'd8', to: 'h4', moveAt: 1234 },
      },
    ]);

    const expectedUpdated: MatchState = {
      status: 'complete',
      type: 'bestOf',
      rounds: 1,
      endedGames: [
        {
          ...{
            ...createOngoingGame({
              timeClass: 'blitz',
              // challengerColor: 'w',
              lastMoveAt: 1234,
              startedAt: 123,
            }),
            status: 'complete',
            pgn: '1. g4 e6 2. f3 Qh4#',
            lastMoveBy: 'black',
            winner: 'black',
            gameOverReason: GameOverReason['checkmate'],
          },
        },
      ],
      challenger: { id: CONSTANTS.challengerId, points: 0 },
      challengee: { id: CONSTANTS.challengeeId, points: 1 }, // TODO: Start adding the points here as well
      winner: 'challengee',
      gameInPlay: null,

      // Defaults
      timeToAbortMs: CONSTANTS.timeToAbortMs,
      breakDurationMs: CONSTANTS.breakDurationMs,
    };

    expect(actualUpdate).toEqual(expectedUpdated);
  });
});

describe('Start New Match', () => {
  const matchCreateParams: Parameters<typeof createMatchState>[0] = {
    type: 'bestOf',
    rounds: 3,
    timeClass: 'blitz',
    challengeeId: CONSTANTS.challengeeId,
    challengerId: CONSTANTS.challengerId,
    startColor: 'w',
  };

  const pendingMatch = createMatchState(matchCreateParams);
  const idlingMatch = matchReducer(pendingMatch, {
    type: 'play:start',
    payload: {
      at: 123,
      players: CONSTANTS.gamePlayersByColors,
    },
  });

  test('Swap players colors when starting new game if not the first of the series', () => {
    const actualAfterFirstMove = matchReducer(idlingMatch, {
      type: 'play:move',
      payload: { from: 'e2', to: 'e4', moveAt: 123 },
    });

    const expectedAfterFirstMove: MatchState = {
      status: 'pending',
      type: 'bestOf',
      rounds: 3,
      endedGames: [],
      challenger: { id: CONSTANTS.challengerId, points: 0 },
      challengee: { id: CONSTANTS.challengeeId, points: 0 },
      winner: null,
      gameInPlay: {
        ...createPendingGame({
          timeClass: 'blitz',
          players: CONSTANTS.gamePlayersByColors,
        }),
        status: 'idling',
        pgn: '1. e4',
        lastMoveAt: 123,
        lastMoveBy: 'white',
        startedAt: 123,
        winner: null,
      },

      // Defaults
      timeToAbortMs: CONSTANTS.timeToAbortMs,
      breakDurationMs: CONSTANTS.breakDurationMs,
    };

    expect(actualAfterFirstMove).toEqual(expectedAfterFirstMove);

    const actual = applyActionsToMatchReducer(expectedAfterFirstMove, [
      {
        type: 'play:move',
        payload: { from: 'e7', to: 'e6', moveAt: 123 },
      },
      {
        type: 'play:resignGame',
        payload: {
          color: 'white',
        },
      },
      {
        type: 'match:startNewGame',
      },
    ]);

    const expected: MatchState = {
      status: 'ongoing',
      type: 'bestOf',
      rounds: 3,
      endedGames: [
        {
          ...createOngoingGame({
            timeClass: 'blitz',
            startedAt: 123,
            lastMoveAt: 123,
          }),
          status: 'complete',
          pgn: '1. e4 e6',
          lastMoveBy: 'black',
          winner: 'black',
          gameOverReason: GameOverReason['resignation'],
        },
      ],
      winner: null,
      challenger: { id: CONSTANTS.challengerId, points: 0 },
      challengee: { id: CONSTANTS.challengeeId, points: 1 },
      gameInPlay: createPendingGame({
        timeClass: 'blitz',
        players: CONSTANTS.gamePlayersByColorsReversed,
      }),

      // Defaults
      timeToAbortMs: CONSTANTS.timeToAbortMs,
      breakDurationMs: CONSTANTS.breakDurationMs,
    };

    expect(actual).toEqual(expected);
  });
});

describe('End Match when rounds number reached', () => {
  const matchCreateParams: Parameters<typeof createMatchState>[0] = {
    type: 'bestOf',
    rounds: 1,
    timeClass: 'blitz',
    challengeeId: CONSTANTS.challengeeId,
    challengerId: CONSTANTS.challengerId,
    startColor: 'w',
  };

  const pendingMatch = createMatchState(matchCreateParams);
  const idlingMatch = matchReducer(pendingMatch, {
    type: 'play:start',
    payload: {
      at: 123,
      players: CONSTANTS.gamePlayersByColors,
    },
  });

  test('Ending last game should end the series', () => {
    const actual = applyActionsToMatchReducer(idlingMatch, [
      {
        type: 'play:move',
        payload: { from: 'e2', to: 'e4', moveAt: 123 },
      },
      {
        type: 'play:move',
        payload: { from: 'e7', to: 'e6', moveAt: 123 },
      },
      {
        type: 'play:resignGame',
        payload: {
          color: 'black',
        },
      },
    ]);

    const expected: MatchState = {
      status: 'complete',
      type: 'bestOf',
      rounds: 1,
      endedGames: [
        {
          ...createOngoingGame({
            timeClass: 'blitz',
            startedAt: 123,
            lastMoveAt: 123,
          }),
          status: 'complete',
          pgn: '1. e4 e6',
          lastMoveBy: 'black',
          winner: 'white',
          gameOverReason: GameOverReason['resignation'],
        },
      ],
      challenger: { id: CONSTANTS.challengerId, points: 1 },
      challengee: { id: CONSTANTS.challengeeId, points: 0 },
      gameInPlay: null,
      winner: 'challenger',

      // Defaults
      timeToAbortMs: CONSTANTS.timeToAbortMs,
      breakDurationMs: CONSTANTS.breakDurationMs,
    };

    expect(actual).toEqual(expected);
  });

  test('Draw game does NOT impact score', () => {
    const actual = applyActionsToMatchReducer(idlingMatch, [
      {
        type: 'play:move',
        payload: { from: 'e2', to: 'e4', moveAt: 123 },
      },
      {
        type: 'play:move',
        payload: { from: 'e7', to: 'e6', moveAt: 123 },
      },
      {
        type: 'play:sendOffer',
        payload: {
          byPlayer: 'john',
          offerType: 'draw',
        },
      },
      {
        type: 'play:acceptOfferDraw',
      },
    ]);

    const expected: MatchState = {
      status: 'ongoing',
      type: 'bestOf',
      rounds: 1,
      endedGames: [
        {
          ...{
            ...createOngoingGame({
              timeClass: 'blitz',
              startedAt: 123,
              lastMoveAt: 123,
            }),
            offers: [{ byPlayer: 'john', status: 'accepted', type: 'draw' }],
            status: 'complete',
            pgn: '1. e4 e6',
            lastMoveBy: 'black',
            winner: '1/2',
            gameOverReason: GameOverReason['acceptedDraw'],
          },
        },
      ],
      challenger: { id: CONSTANTS.challengerId, points: 0 },
      challengee: { id: CONSTANTS.challengeeId, points: 0 },
      winner: null,
      gameInPlay: null,

      // Defaults
      timeToAbortMs: CONSTANTS.timeToAbortMs,
      breakDurationMs: CONSTANTS.breakDurationMs,
    };

    expect(actual).toEqual(expected);
  });
});

describe('Timer only starts after black moves', () => {
  const matchCreateParams: Parameters<typeof createMatchState>[0] = {
    type: 'openEnded',
    timeClass: 'blitz',
    challengeeId: CONSTANTS.challengeeId,
    challengerId: CONSTANTS.challengerId,
    startColor: 'w',
  };

  const pendingMatch = createMatchState(matchCreateParams);
  const idlingMatch = matchReducer(pendingMatch, {
    type: 'play:start',
    payload: {
      at: 123,
      // challengerColor: 'w',
      players: CONSTANTS.gamePlayersByColors,
    },
  });

  test('timer should NOT start after white move, only after black', () => {
    const moveWhiteTime = new Date().getTime();

    const actualAfterWhiteMove = matchReducer(idlingMatch, {
      type: 'play:move',
      payload: { from: 'e2', to: 'e4', moveAt: moveWhiteTime },
    });

    const expectedAfterWhiteMove: MatchState = {
      status: 'pending',
      type: 'openEnded',
      endedGames: [],
      challenger: { id: CONSTANTS.challengerId, points: 0 },
      challengee: { id: CONSTANTS.challengeeId, points: 0 },
      winner: null,
      gameInPlay: {
        ...createPendingGame({
          timeClass: 'blitz',
          players: CONSTANTS.gamePlayersByColors,
        }),
        timeLeft: {
          lastUpdatedAt: null,
          white: 300000,
          black: 300000,
        },
        status: 'idling',
        pgn: '1. e4',
        lastMoveAt: moveWhiteTime,
        lastMoveBy: 'white',
        startedAt: 123,
        winner: null,
      },

      // Defaults
      timeToAbortMs: CONSTANTS.timeToAbortMs,
      breakDurationMs: CONSTANTS.breakDurationMs,
    };

    expect(actualAfterWhiteMove).toEqual(expectedAfterWhiteMove);

    const moveBlackTime = new Date().getTime();

    const actualAfterBlackMove = matchReducer(actualAfterWhiteMove, {
      type: 'play:move',
      payload: { from: 'e7', to: 'e6', moveAt: moveBlackTime },
    });

    const expectedAfterBlackMove: MatchState = {
      status: 'ongoing',
      type: 'openEnded',
      endedGames: [],
      challenger: { id: CONSTANTS.challengerId, points: 0 },
      challengee: { id: CONSTANTS.challengeeId, points: 0 },
      winner: null,
      gameInPlay: {
        ...createOngoingGame({
          timeClass: 'blitz',
          startedAt: 123,
          lastMoveAt: moveBlackTime,
        }),
        status: 'ongoing',
        pgn: '1. e4 e6',
        lastMoveBy: 'black',
        winner: null,
      },

      // Defaults
      timeToAbortMs: CONSTANTS.timeToAbortMs,
      breakDurationMs: CONSTANTS.breakDurationMs,
    };

    expect(actualAfterBlackMove).toEqual(expectedAfterBlackMove);

    const lastMoveTime = new Date().getTime() + 1;
    const actual = matchReducer(actualAfterBlackMove, {
      type: 'play:move',
      payload: { from: 'c2', to: 'c4', moveAt: lastMoveTime },
    });

    const { timeLeft: actualTimeLeft } = actual?.gameInPlay || {};

    expect(actualTimeLeft?.black).toEqual(300000);
    expect(actualTimeLeft?.white).not.toEqual(30000);
  });
});

describe('Abort', () => {
  const matchCreateParams: Parameters<typeof createMatchState>[0] = {
    type: 'bestOf',
    rounds: 3,
    timeClass: 'blitz',
    challengeeId: CONSTANTS.challengeeId,
    challengerId: CONSTANTS.challengerId,
    startColor: 'w',
  };

  const pendingMatch = createMatchState(matchCreateParams);
  const idlingMatch = matchReducer(pendingMatch, {
    type: 'play:start',
    payload: {
      at: 123,
      players: CONSTANTS.gamePlayersByColors,
    },
  });

  test('aborting first game will abort the whole match', () => {
    const actual = matchReducer(idlingMatch, {
      type: 'play:abortGame',
      payload: {
        color: 'white',
      },
    });

    const expected: MatchState = {
      status: 'aborted',
      type: 'bestOf',
      rounds: 3,
      endedGames: [
        {
          ...createPendingGame({
            timeClass: 'blitz',
            players: CONSTANTS.gamePlayersByColors,
          }),
          offers: [],
          status: 'aborted',
          pgn: '',
          lastMoveAt: null,
          lastMoveBy: 'black',
          winner: null,
          startedAt: 123,
        },
      ],
      challenger: { id: CONSTANTS.challengerId, points: 0 },
      challengee: { id: CONSTANTS.challengeeId, points: 0 },
      winner: null,
      gameInPlay: null,

      // Defaults
      timeToAbortMs: CONSTANTS.timeToAbortMs,
      breakDurationMs: CONSTANTS.breakDurationMs,
    };

    expect(expected).toEqual(actual);
  });

  test('aborting 2nd game will complete the match and have a winner - abort with white', () => {
    const newMatch = applyActionsToReducer(matchReducer, idlingMatch, [
      {
        type: 'play:move',
        payload: { from: 'e2', to: 'e4', moveAt: 123 },
      },
      {
        type: 'play:move',
        payload: { from: 'e7', to: 'e6', moveAt: 123 },
      },
      {
        type: 'play:resignGame',
        payload: {
          color: 'black',
        },
      },
      {
        type: 'match:startNewGame',
      },
    ]);

    const expectedNew: MatchState = {
      status: 'ongoing',
      type: 'bestOf',
      rounds: 3,
      endedGames: [
        {
          ...createOngoingGame({
            timeClass: 'blitz',
            startedAt: 123,
            lastMoveAt: 123,
          }),
          offers: [],
          status: 'complete',
          pgn: '1. e4 e6',
          lastMoveBy: 'black',
          winner: 'white',
          gameOverReason: GameOverReason['resignation'],
        },
      ],
      challenger: { id: CONSTANTS.challengerId, points: 1 },
      challengee: { id: CONSTANTS.challengeeId, points: 0 },
      winner: null,
      gameInPlay: createPendingGame({
        timeClass: 'blitz',
        players: CONSTANTS.gamePlayersByColorsReversed,
      }),

      // Defaults
      timeToAbortMs: CONSTANTS.timeToAbortMs,
      breakDurationMs: CONSTANTS.breakDurationMs,
    };

    expect(newMatch).toEqual(expectedNew);

    const actual = applyActionsToReducer(matchReducer, newMatch, [
      {
        type: 'play:start',
        payload: {
          at: 123,
          players: CONSTANTS.gamePlayersByColorsReversed,
        },
      },
      {
        type: 'play:abortGame',
        payload: {
          color: 'white',
        },
      },
    ]);

    const expected: MatchState = {
      status: 'complete',
      type: 'bestOf',
      rounds: 3,
      endedGames: [
        {
          ...createOngoingGame({
            timeClass: 'blitz',
            startedAt: 123,
            lastMoveAt: 123,
          }),
          offers: [],
          status: 'complete',
          pgn: '1. e4 e6',
          lastMoveBy: 'black',
          winner: 'white',
          gameOverReason: GameOverReason['resignation'],
        },
        {
          ...createPendingGame({
            timeClass: 'blitz',
            players: CONSTANTS.gamePlayersByColorsReversed,
          }),
          offers: [],
          status: 'aborted',
          pgn: '',
          lastMoveAt: null,
          lastMoveBy: 'black',
          winner: null,
          startedAt: 123,
        },
      ],
      challenger: { id: CONSTANTS.challengerId, points: 1 },
      challengee: { id: CONSTANTS.challengeeId, points: 0 },
      winner: 'challenger',
      gameInPlay: null,

      // Defaults
      timeToAbortMs: CONSTANTS.timeToAbortMs,
      breakDurationMs: CONSTANTS.breakDurationMs,
    };

    expect(actual).toEqual(expected);
  });

  test('Aborting second game will complete the match and have a winner - abort with black', () => {
    const newMatch = applyActionsToMatchReducer(idlingMatch, [
      {
        type: 'play:move',
        payload: { from: 'e2', to: 'e4', moveAt: 123 },
      },
      {
        type: 'play:move',
        payload: { from: 'e7', to: 'e6', moveAt: 123 },
      },
      {
        type: 'play:resignGame',
        payload: {
          color: 'black',
        },
      },
      {
        type: 'match:startNewGame',
      },
    ]);

    const expectedNewMatch: MatchState = {
      status: 'ongoing',
      type: 'bestOf',
      rounds: 3,
      endedGames: [
        {
          ...createOngoingGame({
            timeClass: 'blitz',
            startedAt: 123,
            lastMoveAt: 123,
          }),
          offers: [],
          status: 'complete',
          pgn: '1. e4 e6',
          lastMoveBy: 'black',
          winner: 'white',
          gameOverReason: GameOverReason['resignation'],
        },
      ],
      challenger: { id: CONSTANTS.challengerId, points: 1 },
      challengee: { id: CONSTANTS.challengeeId, points: 0 },
      winner: null,
      gameInPlay: {
        ...createPendingGame({
          timeClass: 'blitz',
          players: CONSTANTS.gamePlayersByColorsReversed,
        }),
      },

      // Defaults
      timeToAbortMs: CONSTANTS.timeToAbortMs,
      breakDurationMs: CONSTANTS.breakDurationMs,
    };

    expect(newMatch).toEqual(expectedNewMatch);

    const actual = applyActionsToMatchReducer(newMatch, [
      {
        type: 'play:start',
        payload: {
          at: 123,
          players: CONSTANTS.gamePlayersByColorsReversed,
        },
      },
      {
        type: 'play:move',
        payload: { from: 'e2', to: 'e4', moveAt: 123 },
      },
      {
        type: 'play:abortGame',
        payload: {
          color: 'black',
        },
      },
    ]);

    const expected: MatchState = {
      status: 'complete',
      type: 'bestOf',
      rounds: 3,
      endedGames: [
        {
          ...createOngoingGame({
            timeClass: 'blitz',
            startedAt: 123,
            lastMoveAt: 123,
          }),
          offers: [],
          status: 'complete',
          pgn: '1. e4 e6',
          lastMoveBy: 'black',
          winner: 'white',
          gameOverReason: GameOverReason['resignation'],
        },
        {
          ...createPendingGame({
            timeClass: 'blitz',
            players: CONSTANTS.gamePlayersByColorsReversed,
          }),
          offers: [],
          status: 'aborted',
          pgn: '1. e4',
          lastMoveAt: 123,
          lastMoveBy: 'white',
          winner: null,
          startedAt: 123,
        },
      ],
      challenger: { id: CONSTANTS.challengerId, points: 1 },
      challengee: { id: CONSTANTS.challengeeId, points: 0 },
      winner: 'challengee',
      gameInPlay: null,

      // Defaults
      timeToAbortMs: CONSTANTS.timeToAbortMs,
      breakDurationMs: CONSTANTS.breakDurationMs,
    };

    expect(actual).toEqual(expected);
  });
});
