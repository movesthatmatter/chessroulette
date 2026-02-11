import { printMatrix } from '../matrix';
import { ChessFENBoard } from './ChessFENBoard';

const STARTING_BOARD = [
  ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
  ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
  ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
];

test('starts with starting fen when nothing is given', () => {
  const chessFenBoard = new ChessFENBoard();

  expect(chessFenBoard.fen).toBe(ChessFENBoard.STARTING_FEN);
  expect(chessFenBoard.board).toEqual(STARTING_BOARD);
});

test('starts with given FEN', () => {
  const chessFenBoard = new ChessFENBoard(
    'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w KQkq - 0 1'
  );

  expect(chessFenBoard.fen).toBe(
    'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w KQkq - 0 1'
  );

  expect(chessFenBoard.board).toEqual([
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', '', '', 'p', 'p', 'p', 'p'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', 'p', '', '', '', ''],
    ['', '', 'p', '', 'P', 'P', '', ''],
    ['', '', 'P', '', '', 'N', 'P', ''],
    ['P', 'P', '', 'P', '', '', '', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', '', 'R'],
  ]);
});

describe('Fen State Notation', () => {
  describe('Turn', () => {
    test('Invalid Turn', () => {
      const actual = () => {
        new ChessFENBoard(
          'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R u KQkq - 0 1' // Notice the invalid 'u' in the 2nd position
        );
      };

      expect(actual).toThrow('InvalidTurnNotation');
    });

    test('White Turn', () => {
      const actual = new ChessFENBoard(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w KQkq - 0 1'
      ).fen;

      expect(actual).toBe(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w KQkq - 0 1'
      );
    });

    test('Black Turn', () => {
      const actual = new ChessFENBoard(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R b KQkq - 0 1'
      ).fen;

      expect(actual).toBe(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R b KQkq - 0 1'
      );
    });
  });

  describe('Castling Rights', () => {
    test('Invalid Castling Rights Notatoin', () => {
      const actual = () => {
        new ChessFENBoard(
          'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w Kskq - 0 1' // Notice the invalid 's' in the 3rd position
        );
      };

      expect(actual).toThrow('InvalidCastlingRightsNotation');
    });

    test('Fails when colors are reversed (black first)', () => {
      const actual = () => {
        new ChessFENBoard(
          'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w kqKQ - 0 1'
        );
      };

      expect(actual).toThrow('InvalidCastlingRightsNotation');
    });

    test('No Castling', () => {
      const actual = new ChessFENBoard(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R b - - 0 1'
      ).fen;

      expect(actual).toBe(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R b - - 0 1'
      );
    });

    test('White King & Black Queen only', () => {
      const actual = new ChessFENBoard(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R b Kq - 0 1'
      ).fen;

      expect(actual).toBe(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R b Kq - 0 1'
      );
    });

    test('White King, Black King & Queen only', () => {
      const actual = new ChessFENBoard(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R b Kkq - 0 1'
      ).fen;

      expect(actual).toBe(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R b Kkq - 0 1'
      );
    });

    test('Black King only', () => {
      const actual = new ChessFENBoard(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R b k - 0 1'
      ).fen;

      expect(actual).toBe(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R b k - 0 1'
      );
    });
  });

  describe('EnPassant', () => {
    test('Fails when enPassant is invalid', () => {
      const actual = () => {
        new ChessFENBoard(
          'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w - e 0 1' // Notice the invalid 'e' in the 4th position
        );
      };

      expect(actual).toThrow('InvalidEnPassantNotation');
    });

    test('Fails when enPassant Square is invalid', () => {
      const actual = () => {
        new ChessFENBoard(
          'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w - e9 0 1' // Notice the invalid 'e9' in the 4th position
        );
      };

      expect(actual).toThrow('InvalidEnPassantNotation');
    });

    test('No EnPassant', () => {
      const actual = new ChessFENBoard(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w - - 0 1'
      ).fen;

      expect(actual).toBe(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w - - 0 1'
      );
    });

    test('No EnPassant', () => {
      const actual = new ChessFENBoard(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w - - 0 1'
      ).fen;

      expect(actual).toBe(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w - - 0 1'
      );
    });

    // Fix this - took out on Jun 4 2024, when adding Fen validation to ChessFenBoard!
    xtest('EnPassant with Valid Square', () => {
      const actual = new ChessFENBoard(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w - e3 0 1'
      ).fen;

      expect(actual).toBe(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w - e3 0 1'
      );
    });
  });

  describe('Half Moves', () => {
    test('Negative Half Moves Count', () => {
      const actual = () => {
        new ChessFENBoard(
          'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w - - -2 1' // Notice the invalid '-2' in the 5th position
        );
      };

      expect(actual).toThrow('InvalidHalfMovesNotation');
    });

    test('Half Moves as String', () => {
      const actual = () => {
        new ChessFENBoard(
          'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w - - s 1' // Notice the invalid 's' in the 5th position
        );
      };

      expect(actual).toThrow('InvalidHalfMovesNotation');
    });

    test('Half Moves as Positive Number', () => {
      const actual = new ChessFENBoard(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w - - 5 1'
      ).fen;

      expect(actual).toBe(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w - - 5 1'
      );
    });
  });

  describe('Full Moves', () => {
    test('Negative Full Moves Count', () => {
      const actual = () => {
        new ChessFENBoard(
          'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w - - 0 -1' // Notice the invalid '-1' in the 6th position
        );
      };

      expect(actual).toThrow('InvalidFullMovesNotation');
    });

    test('Zero Full Moves Count (needs to always be positive)', () => {
      const actual = () => {
        new ChessFENBoard(
          'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w - - 0 0' // Notice the invalid '0' in the 6th position
        );
      };

      expect(actual).toThrow('InvalidFullMovesNotation');
    });

    test('Full Moves as String', () => {
      const actual = () => {
        new ChessFENBoard(
          'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w - - 0 s' // Notice the invalid 's' in the 6th position
        );
      };

      expect(actual).toThrow('InvalidFullMovesNotation');
    });

    test('Full Moves as String', () => {
      const actual = new ChessFENBoard(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w - - 0 2'
      ).fen;

      expect(actual).toBe(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w - - 0 2'
      );
    });
  });
});

describe('put', () => {
  test('adds any piece in any square', () => {
    const chessFenBoard = new ChessFENBoard();

    chessFenBoard.addPiece('a3', 'B');
    chessFenBoard.addPiece('g1', 'q');
    chessFenBoard.addPiece('b4', 'P');
    chessFenBoard.addPiece('c4', 'p');
    chessFenBoard.addPiece('a1', '');

    expect(chessFenBoard.fen).toBe(
      'rnbqkbnr/pppppppp/8/8/1Pp5/B7/PPPPPPPP/1NBQKBqR w KQkq - 0 1'
    );

    expect(chessFenBoard.board).toEqual([
      ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
      ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', 'P', 'p', '', '', '', '', ''],
      ['B', '', '', '', '', '', '', ''],
      ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      ['', 'N', 'B', 'Q', 'K', 'B', 'q', 'R'],
    ]);
  });

  test('cannot add another king', () => {
    const chessFenBoard = new ChessFENBoard();

    const actual = () => chessFenBoard.addPiece('a3', 'k');

    expect(actual).toThrow();
  });
});

describe('UpdateFen', () => {
  describe('From Fen State', () => {
    test('With Valid Props', () => {
      const chessFenBoard = new ChessFENBoard();

      chessFenBoard.setFenState({
        turn: 'b',
        halfMoves: 5,
        fullMoves: 1,
        castlingRights: {
          w: {
            kingSide: false,
          },
        },
      });

      const actual = chessFenBoard.fen;

      expect(actual).toBe(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b Qkq - 5 1'
      );
    });

    test('With Invalid Full Moves', () => {
      const chessFenBoard = new ChessFENBoard();

      const actual = () => {
        chessFenBoard.setFenState({
          turn: 'b',
          halfMoves: 5,
          fullMoves: 0,
          castlingRights: {
            w: {
              kingSide: true,
            },
          },
        });
      };

      expect(actual).toThrow('InvalidFenState:InvalidFullMoves');
    });

    test('With Invalid Half Moves', () => {
      const chessFenBoard = new ChessFENBoard();

      const actual = () => {
        chessFenBoard.setFenState({
          turn: 'b',
          halfMoves: -1,
          fullMoves: 2,
          castlingRights: {
            w: {
              kingSide: true,
            },
          },
        });
      };

      expect(actual).toThrow('InvalidFenState:InvalidHalfMoves');
    });
  });

  describe('From Fen Notation', () => {
    test('With Valid Notation', () => {
      const chessFenBoard = new ChessFENBoard();

      chessFenBoard.setFenState('b Kq e3 0 1');

      const actual = chessFenBoard.fen;

      expect(actual).toBe(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b Kq e3 0 1'
      );
    });

    test('With Invalid Turn', () => {
      const chessFenBoard = new ChessFENBoard();

      const actual = () => {
        chessFenBoard.setFenState('- Kq e3 0 1');
      };

      expect(actual).toThrow('InvalidTurnNotation');
    });

    test('With Invalid Full Moves', () => {
      const chessFenBoard = new ChessFENBoard();

      const actual = () => {
        chessFenBoard.setFenState('w Kq e3 0 0');
      };

      expect(actual).toThrow('InvalidFullMovesNotation');
    });
  });
});

describe('move', () => {
  test('moves any existent piece to any square', () => {
    const chessFenBoard = new ChessFENBoard();

    chessFenBoard.move({ from: 'a2', to: 'a5' });
    chessFenBoard.move({ from: 'h1', to: 'c4' });
    chessFenBoard.move({ from: 'e8', to: 'd1' });

    expect(chessFenBoard.fen).toBe(
      'rnbq1bnr/pppppppp/8/P7/2R5/8/1PPPPPPP/RNBkKBN1 w KQkq - 0 2'
    );

    expect(chessFenBoard.board).toEqual([
      ['r', 'n', 'b', 'q', '', 'b', 'n', 'r'],
      ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
      ['', '', '', '', '', '', '', ''],
      ['P', '', '', '', '', '', '', ''],
      ['', '', 'R', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      ['R', 'N', 'B', 'k', 'K', 'B', 'N', ''],
    ]);
  });

  test('throws when attempting to move an inexistent piece', () => {
    const chessFenBoard = new ChessFENBoard(
      'rnbq1bnr/pppppppp/8/P7/2R5/8/1PPPPPPP/RNBkKBN1 w - - 0 1'
    );

    const actual = () => {
      chessFenBoard.move({ from: 'a2', to: 'a3' });
    };

    expect(actual).toThrow('Move Error: the from square (a2) was empty!');
  });

  test('throws when attempting to move an inexistent piece', () => {
    const chessFenBoard = new ChessFENBoard(
      'rnbq1bnr/pppppppp/8/P7/2R5/8/1PPPPPPP/RNBkKBN1 w - - 0 1'
    );

    const actual = () => {
      chessFenBoard.move({ from: 'a2', to: 'a3' });
    };

    expect(actual).toThrow('Move Error: the from square (a2) was empty!');
  });

  test('moves with promotion', () => {
    const chessFenBoard = new ChessFENBoard();

    chessFenBoard.move({ from: 'a2', to: 'a8', promoteTo: 'Q' });

    const actual = chessFenBoard.fen;

    expect(actual).toBe(
      'Qnbqkbnr/pppppppp/8/8/8/8/1PPPPPPP/RNBQKBNR b KQkq - 0 1'
    );
  });

  test('full moves get counted correctly', () => {
    const chessFenBoard = new ChessFENBoard();

    expect(chessFenBoard.fen).toBe(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    );

    chessFenBoard.move({ from: 'e2', to: 'e4' });

    expect(chessFenBoard.fen).toBe(
      'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
    );

    chessFenBoard.move({ from: 'd7', to: 'd6' });

    // Increments Full Move
    expect(chessFenBoard.fen).toBe(
      'rnbqkbnr/ppp1pppp/3p4/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2'
    );

    chessFenBoard.move({ from: 'd1', to: 'g4' });

    // Increments Full Move & Half Move b/c it's not a pawn move
    expect(chessFenBoard.fen).toBe(
      'rnbqkbnr/ppp1pppp/3p4/8/4P1Q1/8/PPPP1PPP/RNB1KBNR b KQkq - 1 2'
    );

    chessFenBoard.move({ from: 'g8', to: 'f6' });

    // Increments Full Move & Half Move b/c it's not a pawn move
    expect(chessFenBoard.fen).toBe(
      'rnbqkb1r/ppp1pppp/3p1n2/8/4P1Q1/8/PPPP1PPP/RNB1KBNR w KQkq - 2 3'
    );

    chessFenBoard.move({ from: 'a2', to: 'a3' });

    // Resets Half Move b/c it's a pawn move, and does not increment Full Move b/c it's not black
    expect(chessFenBoard.fen).toBe(
      'rnbqkb1r/ppp1pppp/3p1n2/8/4P1Q1/P7/1PPP1PPP/RNB1KBNR b KQkq - 0 3'
    );

    chessFenBoard.move({ from: 'c8', to: 'g4' });

    // Increments Full Move & Half Move b/c it's not a pawn move
    expect(chessFenBoard.fen).toBe(
      'rn1qkb1r/ppp1pppp/3p1n2/8/4P1b1/P7/1PPP1PPP/RNB1KBNR w KQkq - 0 4'
    );

    // More moves
    chessFenBoard.move({ from: 'f1', to: 'c4' });
    chessFenBoard.move({ from: 'b8', to: 'c6' });
    chessFenBoard.move({ from: 'g1', to: 'f3' });
    chessFenBoard.move({ from: 'd8', to: 'd7' });

    expect(chessFenBoard.fen).toBe(
      'r3kb1r/pppqpppp/2np1n2/8/2B1P1b1/P4N2/1PPP1PPP/RNB1K2R w KQkq - 4 6'
    );

    // Castle Move
    chessFenBoard.move({ from: 'e1', to: 'g1' });
    expect(chessFenBoard.fen).toBe(
      'r3kb1r/pppqpppp/2np1n2/8/2B1P1b1/P4N2/1PPP1PPP/RNB2RK1 b kq - 5 6'
    );
  });
});

describe('Castling Move', () => {
  test('castling for white on king side', () => {
    const chessFenBoard = new ChessFENBoard(
      'rnbqkb1r/5ppp/p2ppn2/1p6/3NP3/1BN5/PPP2PPP/R1BQK2R w KQkq - 0 1'
    );

    const actualMove = chessFenBoard.move({ from: 'e1', to: 'g1' });
    const actualFen = chessFenBoard.fen;

    expect(actualMove).toEqual({
      captured: undefined,
      color: 'w',
      from: 'e1',
      to: 'g1',
      piece: 'k',
      san: '0-0',
    });
    expect(actualFen).toBe(
      'rnbqkb1r/5ppp/p2ppn2/1p6/3NP3/1BN5/PPP2PPP/R1BQ1RK1 b kq - 1 1'
    );
  });

  test('castling for white on queen side', () => {
    const chessFenBoard = new ChessFENBoard(
      'r3k2r/pppppppp/1nbq1bn1/8/8/1NBQ1BN1/PPPPPPPP/R3K2R w KQkq - 10 6'
    );
    const actualMove = chessFenBoard.move({ from: 'e1', to: 'c1' });

    expect(actualMove).toEqual({
      captured: undefined,
      color: 'w',
      from: 'e1',
      to: 'c1',
      piece: 'k',
      san: '0-0-0',
    });

    const actualFen = chessFenBoard.fen;
    expect(actualFen).toBe(
      'r3k2r/pppppppp/1nbq1bn1/8/8/1NBQ1BN1/PPPPPPPP/2KR3R b kq - 11 6'
    );
  });

  test('castling for black on king side', () => {
    const chessFenBoard = new ChessFENBoard(
      'r3k2r/pppppppp/1nbq1bn1/8/8/1NBQ1BN1/PPPPPPPP/R3K2R b KQkq - 10 6'
    );
    const actualMove = chessFenBoard.move({ from: 'e8', to: 'g8' });

    expect(actualMove).toEqual({
      captured: undefined,
      color: 'b',
      from: 'e8',
      to: 'g8',
      piece: 'k',
      san: '0-0',
    });

    const actualFen = chessFenBoard.fen;
    expect(actualFen).toBe(
      'r4rk1/pppppppp/1nbq1bn1/8/8/1NBQ1BN1/PPPPPPPP/R3K2R w KQ - 11 7'
    );
  });

  test('castling for black on queen side', () => {
    const chessFenBoard = new ChessFENBoard(
      'r3k2r/pppppppp/1nbq1bn1/8/8/1NBQ1BN1/PPPPPPPP/R3K2R b KQkq - 10 6'
    );
    const actualMove = chessFenBoard.move({ from: 'e8', to: 'c8' });

    expect(actualMove).toEqual({
      captured: undefined,
      color: 'b',
      from: 'e8',
      to: 'c8',
      piece: 'k',
      san: '0-0-0',
    });

    const actualFen = chessFenBoard.fen;
    expect(actualFen).toBe(
      '2kr3r/pppppppp/1nbq1bn1/8/8/1NBQ1BN1/PPPPPPPP/R3K2R w KQ - 11 7'
    );
  });

  describe('Move San', () => {
    // Ensure the moves have the correct san notation

    test('Basic Pawn Move', () => {
      const chessFenBoard = new ChessFENBoard(ChessFENBoard.STARTING_FEN);

      const actual = chessFenBoard.move({ from: 'e2', to: 'e4' });

      expect(actual.san).toBe('e4');
    });

    test('Basic Piece (Knight) Move', () => {
      const chessFenBoard = new ChessFENBoard(ChessFENBoard.STARTING_FEN);
      const actual = chessFenBoard.move({ from: 'b1', to: 'c3' });

      expect(actual.san).toBe('Nc3');
    });

    test('Pawn Captures', () => {
      const chessFenBoard = new ChessFENBoard(
        'rnbqkb1r/ppp1pppp/4n3/3P4/8/8/PPPP1PPP/RNBQKBNR w KQkq - 1 3'
      );
      const actual = chessFenBoard.move({ from: 'd5', to: 'e6' });

      expect(actual.san).toBe('dxe6');
    });

    test('King put in Check Move', () => {
      const chessFenBoard = new ChessFENBoard(
        'rnbqkbnr/ppppp1pp/5p2/8/8/4P3/PPPP1PPP/RNBQKBNR w KQkq - 0 2'
      );
      const actual = chessFenBoard.move({ from: 'd1', to: 'h5' });

      expect(actual.san).toBe('Qh5+');
    });

    test('King Mated Move', () => {
      const chessFenBoard = new ChessFENBoard(
        'rnbqkbnr/pppp1ppp/4p3/8/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq g3 0 2'
      );

      const actual = chessFenBoard.move({ from: 'd8', to: 'h4' });

      expect(actual.san).toBe('Qh4#');
    });

    test('Promo Move', () => {
      const chessFenBoard = new ChessFENBoard('4k3/8/8/8/8/8/5K1p/8 b - - 1 1');
      const actual = chessFenBoard.move({
        from: 'h2',
        to: 'h1',
        promoteTo: 'Q',
      });

      expect(actual.san).toBe('h1=Q');
    });

    test('Promo Move results in Check', () => {
      const chessFenBoard = new ChessFENBoard('4k3/8/8/8/8/8/7p/4K3 b - - 0 1');
      const actual = chessFenBoard.move({
        from: 'h2',
        to: 'h1',
        promoteTo: 'q',
      });

      expect(actual.san).toBe('h1=Q+');
    });

    test('Promo Move results in CheckMate', () => {
      const chessFenBoard = new ChessFENBoard('8/8/8/8/8/7k/4p3/7K b - - 2 2');
      const actual = chessFenBoard.move({
        from: 'e2',
        to: 'e1',
        promoteTo: 'q',
      });

      expect(actual.san).toBe('e1=Q#');
    });
  });

  describe('en passant', () => {
    test('fen adds the en passant notation when pawn moves 2 squares | white', () => {
      const chessFenBoard = new ChessFENBoard(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      );

      chessFenBoard.move({ from: 'e2', to: 'e4' });

      const actualFen = chessFenBoard.fen;

      expect(actualFen).toBe(
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
      );
    });

    test('fen adds the en passant notation when pawn moves 2 squares | black', () => {
      const chessFenBoard = new ChessFENBoard(
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
      );

      chessFenBoard.move({ from: 'd7', to: 'd5' });

      const actualFen = chessFenBoard.fen;

      expect(actualFen).toBe(
        'rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2'
      );
    });

    test('fen removes the en passant notation when any other move', () => {
      const chessFenBoard = new ChessFENBoard(
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
      );

      chessFenBoard.move({ from: 'd2', to: 'd3' });

      const actualFen = chessFenBoard.fen;

      expect(actualFen).toBe(
        'rnbqkbnr/pppppppp/8/8/4P3/3P4/PPP2PPP/RNBQKBNR b KQkq - 0 1'
      );
    });

    test('does not add en passant when pawn moves on different ranks', () => {
      const chessFenBoard = new ChessFENBoard(
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
      );

      chessFenBoard.move({ from: 'd2', to: 'e4' });

      const actualFen = chessFenBoard.fen;

      expect(actualFen).toBe(
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPP2PPP/RNBQKBNR b KQkq - 0 1'
      );
    });

    describe('En Passant capturers', () => {
      test('takes the moved white pawn on e6', () => {
        const chessFenBoard = new ChessFENBoard(
          'rnbqkbnr/pppp1ppp/8/4pP2/8/8/PPPPP1PP/RNBQKBNR w KQkq e6 0 2'
        );

        const actualMove = chessFenBoard.move({ from: 'f5', to: 'e6' });
        const actualFen = chessFenBoard.fen;

        expect(actualMove).toEqual({
          captured: 'p',
          color: 'w',
          from: 'f5',
          piece: 'p',
          san: 'fxe6',
          to: 'e6',
          promoteTo: undefined,
        });
        expect(actualFen).toBe(
          'rnbqkbnr/pppp1ppp/4P3/8/8/8/PPPPP1PP/RNBQKBNR b KQkq - 0 2'
        );
      });

      test('takes the moved white pawn on e3', () => {
        const chessFenBoard = new ChessFENBoard(
          'rnbqkbnr/ppp1pppp/8/8/3pP3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 2'
        );

        const actualMove = chessFenBoard.move({ from: 'd4', to: 'e3' });
        const actualFen = chessFenBoard.fen;

        expect(actualMove).toEqual({
          captured: 'P',
          color: 'b',
          from: 'd4',
          piece: 'p',
          san: 'dxe3',
          to: 'e3',
          promoteTo: undefined,
        });
        expect(actualFen).toBe(
          'rnbqkbnr/ppp1pppp/8/8/8/4p3/PPPP1PPP/RNBQKBNR w KQkq - 0 3'
        );
      });
    });
  });
});

describe('pieces', () => {
  test('piece', () => {
    const chessFenBoard = new ChessFENBoard();

    const actualWhiteBishop = chessFenBoard.piece('c1');
    expect(actualWhiteBishop).toBe('B');

    const actualWhitePawn = chessFenBoard.piece('a2');
    expect(actualWhitePawn).toBe('P');

    const actualBlackKing = chessFenBoard.piece('e8');
    expect(actualBlackKing).toBe('k');
  });
});

describe('getAllPicesByColor', () => {
  test('from starting position', () => {
    const chessFenBoard = new ChessFENBoard();

    const actualWhite = chessFenBoard.getAllPiecesByColor('w');
    expect(actualWhite).toEqual([
      'P',
      'P',
      'P',
      'P',
      'P',
      'P',
      'P',
      'P',
      'R',
      'N',
      'B',
      'Q',
      'K',
      'B',
      'N',
      'R',
    ]);

    const actualBlack = chessFenBoard.getAllPiecesByColor('b');
    expect(actualBlack).toEqual([
      'r',
      'n',
      'b',
      'q',
      'k',
      'b',
      'n',
      'r',
      'p',
      'p',
      'p',
      'p',
      'p',
      'p',
      'p',
      'p',
    ]);
  });

  test('just kings', () => {
    const chessFenBoard = new ChessFENBoard(ChessFENBoard.ONLY_KINGS_FEN);

    const actualWhite = chessFenBoard.getAllPiecesByColor('w');
    expect(actualWhite).toEqual(['K']);

    const actualBlack = chessFenBoard.getAllPiecesByColor('b');
    expect(actualBlack).toEqual(['k']);
  });

  test('end game, white just king', () => {
    const chessFenBoard = new ChessFENBoard(
      '1n2kbnr/rbp5/4p2p/7p/8/8/2K5/8 b k - 0 19'
    );

    const actualWhite = chessFenBoard.getAllPiecesByColor('w');
    expect(actualWhite).toEqual(['K']);

    const actualBlack = chessFenBoard.getAllPiecesByColor('b');
    expect(actualBlack).toEqual([
      'n',
      'k',
      'b',
      'n',
      'r',
      'r',
      'b',
      'p',
      'p',
      'p',
      'p',
    ]);
  });
});

describe('Validate FEN', () => {
  test('passes with correct fen', () => {
    const actual = ChessFENBoard.validateFenString(
      'r3kb1r/pppqpppp/2np1n2/8/2B1P1b1/P4N2/1PPP1PPP/RNB2RK1 b kq - 5 6'
    );

    expect(actual.ok).toBe(true);
  });

  test('passes with correct fen', () => {
    const actual = ChessFENBoard.validateFenString(
      'r3kb1r/pppqpppp/2np1n2/8/2B1P1b1/P4N2/1PPP1PPP/RNB2RK1 b kq - 5 4'
    );

    expect(actual.ok).toBe(true);
  });

  test('fails with incorrect fen state', () => {
    const actual = ChessFENBoard.validateFenString(
      'r3kb1r/pppqpppp/2np1n2/8/2 b kqs - 5 6'
    );

    expect(actual.ok).toBe(false);
  });

  test('fails with incorrect fen position notation', () => {
    const actual = ChessFENBoard.validateFenString('  b kq - 5 6');

    expect(actual.ok).toBe(false);
  });

  test('fails with incorrect fen position notation', () => {
    const actual = ChessFENBoard.validateFenString('asdasda  b kq - 5 6');

    expect(actual.ok).toBe(false);
  });
});
