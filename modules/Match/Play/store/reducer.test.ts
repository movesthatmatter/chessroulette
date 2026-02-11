import { PlayActions } from './types';
import { reducer as playReducer } from './reducer';
import { Game, OngoingGame, createPendingGame } from '@/modules/Game';
import { ChessPGN, ChessRouler, GameOverReason } from '@/lib/ChessRouler';
import { swapColor } from '@/lib/ChessFENBoard';

const PLAYERS_BY_COLOR = {
  w: 'test-a',
  b: 'test-b',
};

const PLAYERS_BY_COLOR_REVERSED = {
  w: 'test-b',
  b: 'test-a',
};

describe('Game Status: Pending > Idling', () => {
  test('It advances to "idling" on calling "play:start"', () => {
    const action: PlayActions = {
      type: 'play:start',
      payload: { at: 123, players: PLAYERS_BY_COLOR },
    };

    const pendingGame = createPendingGame({
      players: PLAYERS_BY_COLOR,
      timeClass: 'blitz',
    });

    const actual = playReducer(pendingGame, action);

    const expected: Game = {
      status: 'idling',
      timeClass: pendingGame.timeClass,
      timeLeft: {
        ...pendingGame.timeLeft,
        lastUpdatedAt: null,
      },
      pgn: '',
      // these 2 are the same for now
      startedAt: 123,
      lastMoveAt: null,
      lastMoveBy: 'b',
      winner: null,
      offers: [],
      gameOverReason: null,
      players: PLAYERS_BY_COLOR,
    };

    expect(actual).toEqual(expected);
  });
});

describe('Game Status: Idling > Idling', () => {
  test('It remains on "idling" on first White Move', () => {
    const pendingGame = createPendingGame({
      players: PLAYERS_BY_COLOR_REVERSED,
      timeClass: 'blitz',
    });

    const idle = playReducer(pendingGame, {
      type: 'play:start',
      payload: { at: 123, players: PLAYERS_BY_COLOR_REVERSED },
    });
    const actual = playReducer(idle, {
      type: 'play:move',
      payload: { from: 'e2', to: 'e4', moveAt: 123 },
    });

    const expected: Game = {
      status: 'idling',
      timeClass: pendingGame.timeClass,
      timeLeft: {
        ...pendingGame.timeLeft,
        lastUpdatedAt: null,
      },
      pgn: '1. e4',
      // these 2 are the same for now
      startedAt: 123,
      lastMoveAt: 123,
      lastMoveBy: 'w',
      winner: null,
      offers: [],
      gameOverReason: null,
      players: PLAYERS_BY_COLOR_REVERSED,
    };

    expect(actual).toEqual(expected);
  });
});

describe('Game Status: Idling > Aborted', () => {
  test('It moves from Idling to Aborted after timer ends', () => {
    const pendingGame = createPendingGame({
      players: PLAYERS_BY_COLOR,
      timeClass: 'blitz',
    });

    const idle = playReducer(pendingGame, {
      type: 'play:start',
      payload: { at: 123, players: PLAYERS_BY_COLOR },
    });
    const actual = playReducer(idle, {
      type: 'play:abortGame',
      payload: { color: 'w' },
    });

    const expected: Game = {
      status: 'aborted',
      timeClass: pendingGame.timeClass,
      timeLeft: pendingGame.timeLeft,
      pgn: '',
      // these 2 are the same for now
      startedAt: 123,
      lastMoveAt: null,
      lastMoveBy: 'b',
      winner: null,
      offers: [],
      gameOverReason: null,
      players: PLAYERS_BY_COLOR,
    };

    expect(actual).toEqual(expected);
  });
});

describe('Game Status: Idling > Ongoing', () => {
  test('It Moves from "idling" to "ongoing" on first Black Move (once both players moved once)', () => {
    const pendingGame = createPendingGame({
      players: PLAYERS_BY_COLOR,
      timeClass: 'blitz',
    });

    const idle = playReducer(pendingGame, {
      type: 'play:start',
      payload: { at: 123, players: PLAYERS_BY_COLOR },
    });

    const playAfterWhiteMove = playReducer(idle, {
      type: 'play:move',
      payload: { from: 'e2', to: 'e4', moveAt: 123 },
    });

    const actual = playReducer(playAfterWhiteMove, {
      type: 'play:move',
      payload: { from: 'e7', to: 'e6', moveAt: 234 },
    });

    const expected: Game = {
      status: 'ongoing',
      // No changes here
      timeClass: pendingGame.timeClass,
      timeLeft: {
        ...pendingGame.timeLeft,
        lastUpdatedAt: 234,
      },
      pgn: '1. e4 e6',
      // these 2 are the same for now
      startedAt: 123,
      lastMoveAt: 234,
      lastMoveBy: 'b',
      winner: null,
      offers: [],
      gameOverReason: null,
      players: PLAYERS_BY_COLOR,
    };

    expect(actual).toEqual(expected);
  });
});

describe('Ongoing > Ongoing', () => {
  // TBD
});

describe('Game Status: Ongoing > Completed', () => {
  const createOngoingGame = ({
    pgn,
    lastMoveAt = 123,
    timeLeft,
  }: {
    pgn: ChessPGN;
    lastMoveAt?: number;
    timeLeft?: Partial<OngoingGame['timeLeft']>;
  }) => {
    const pendingGame = createPendingGame({
      players: PLAYERS_BY_COLOR,
      timeClass: 'blitz',
    });

    try {
      const chessRouler = new ChessRouler({ pgn });

      return {
        ...pendingGame,
        lastMoveBy: swapColor(chessRouler.turn()),
        status: 'ongoing',
        startedAt: 0,
        pgn,
        timeLeft: {
          ...pendingGame.timeLeft,
          lastUpdatedAt: timeLeft?.lastUpdatedAt || lastMoveAt,
          w: timeLeft?.w || pendingGame.timeLeft.w,
          b: timeLeft?.b || pendingGame.timeLeft.b,
        },
        lastMoveAt,
      } satisfies OngoingGame;
    } catch (e) {
      console.error(e);
    }
  };

  test('Player times out (on "play:move" action) but the opponent has insufficient material and is awarded a draw instead of loss', () => {
    const game = createOngoingGame({
      pgn: '1. e4 e6 2. Qg4 d5 3. Qg6 hxg6 4. Ba6 Qg5 5. Nf3 Qxd2+ 6. Bxd2 dxe4 7. Bh6 exf3 8. Na3 gxh6 9. Bxb7 fxg2 10. Nb5 Bxb7 11. Nxa7 gxh1=Q+ 12. Kd2 Qxa1 13. f4 Rxa7 14. h4 Qxa2 15. f5 Qxb2 16. h5 gxh5 17. fxe6 fxe6 18. Kd3 Qxc2+ 19. Kxc2',
      timeLeft: {
        b: 3,
        w: 5,
      },
      lastMoveAt: 123,
    });

    // Black (Stronger) attempts to move but is out of time and the game should complete in a draw b/c of the Insufficient Material Rule
    const actual = playReducer(game, {
      type: 'play:move',
      payload: { from: 'e6', to: 'e5', moveAt: 170 },
    });

    expect(actual.status).toBe('complete');
    expect(actual.gameOverReason).toBe(
      GameOverReason['drawAwardedForInsufficientMaterial'],
    );
    expect(actual.winner).toBe('1/2');
  });

  test('Player times out (on "play:checkTime" action) but the opponent has insufficient material and is awarded a draw instead of loss', () => {
    const game = createOngoingGame({
      pgn: '1. e4 e6 2. Qg4 d5 3. Qg6 hxg6 4. Ba6 Qg5 5. Nf3 Qxd2+ 6. Bxd2 dxe4 7. Bh6 exf3 8. Na3 gxh6 9. Bxb7 fxg2 10. Nb5 Bxb7 11. Nxa7 gxh1=Q+ 12. Kd2 Qxa1 13. f4 Rxa7 14. h4 Qxa2 15. f5 Qxb2 16. h5 gxh5 17. fxe6 fxe6 18. Kd3 Qxc2+ 19. Kxc2',
      timeLeft: {
        b: 3,
        w: 5,
      },
      lastMoveAt: 123,
    });

    // Black (Stronger) attempts to move but is out of time and the game should complete in a draw b/c of the Insufficient Material Rule
    const actual = playReducer(game, {
      type: 'play:checkTime',
      payload: {
        at: 170, // Simluating outside of time
      },
    });

    expect(actual.status).toBe('complete');
    expect(actual.gameOverReason).toBe(
      GameOverReason['drawAwardedForInsufficientMaterial'],
    );
    expect(actual.winner).toBe('1/2');
  });

  test('Player times out (on "play:move") but the opponent has sufficient material to force mate and loses', () => {
    const game = createOngoingGame({
      pgn: '1. e3 c5 2. e4 d5 3. e5 c4 4. f4 Nc6 5. Bxc4 f6 6. Bxd5 f5 7. e6 Nd4 8. d3 Qa5+ 9. c3 Bxe6 10. Bxe6 Nxe6',
      timeLeft: {
        b: 3,
        w: 5,
      },
      lastMoveAt: 123,
    });

    // White times out and loses
    const actual = playReducer(game, {
      type: 'play:move',
      payload: { from: 'h2', to: 'h3', moveAt: 170 },
    });

    expect(actual.status).toBe('complete');
    expect(actual.gameOverReason).toBe(GameOverReason['timeout']);
    expect(actual.winner).toBe('b');
  });

  test('Player times out (on "play:checkTime") but the opponent has sufficient material to force mate and loses', () => {
    const game = createOngoingGame({
      pgn: '1. e3 c5 2. e4 d5 3. e5 c4 4. f4 Nc6 5. Bxc4 f6 6. Bxd5 f5 7. e6 Nd4 8. d3 Qa5+ 9. c3 Bxe6 10. Bxe6 Nxe6',
      timeLeft: {
        b: 3,
        w: 5,
      },
      lastMoveAt: 123,
    });

    // White times out and loses
    const actual = playReducer(game, {
      type: 'play:checkTime',
      payload: {
        at: 170, // Simluating outside of time
      },
    });

    expect(actual.status).toBe('complete');
    expect(actual.gameOverReason).toBe(GameOverReason['timeout']);
    expect(actual.winner).toBe('b');
  });
});
