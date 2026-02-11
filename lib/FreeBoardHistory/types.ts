import type { BlackColor, ChessColor, ShortChessMove, WhiteColor } from '../ChessRouler';
import type { FenBoardDetailedChessMove } from '../ChessFENBoard';

export type FBHBaseNonMove = {
  isNonMove: true;
  san: '...';
  color: ChessColor;
  from?: undefined;
  to?: undefined;
};

export type FBHBaseRealMove = {
  isNonMove?: false;
  san: FenBoardDetailedChessMove['san'];
} & ShortChessMove; // TODO: This can expand later on

export type FBHBaseMove = FBHBaseRealMove | FBHBaseNonMove;

export type FBHWhiteMove = FBHBaseMove & {
  color: WhiteColor;
};

export type FBHBlackMove = FBHBaseMove & {
  color: BlackColor;
};

// TODO: Needed?
export type FBHMove = FBHWhiteMove | FBHBlackMove;

export type FBHRecursiveBaseMove = {
  branchedHistories?: FBHRecursiveHistory[];
};

export type FBHRecursiveWhiteMove = FBHRecursiveBaseMove & FBHWhiteMove;
export type FBHRecursiveBlackMove = FBHRecursiveBaseMove & FBHBlackMove;

export type FBHRecursiveMove = FBHRecursiveWhiteMove | FBHRecursiveBlackMove;

export type FBHRecursiveHalfTurn = [whiteMove: FBHRecursiveWhiteMove];
export type FBHRecursiveFullTurn = [
  whiteMove: FBHRecursiveWhiteMove,
  blackMove: FBHRecursiveBlackMove
];

export type FBHRecursiveTurn = FBHRecursiveHalfTurn | FBHRecursiveFullTurn;

export type FBHRecursiveHistory =
  | FBHRecursiveFullTurn[]
  | [...FBHRecursiveFullTurn[], FBHRecursiveHalfTurn];

export type FBHTurn = FBHRecursiveTurn;
export type FBHHistory = FBHRecursiveHistory;

export type FBHLinearHistory = FBHMove[];

export type FBHIndexMovePosition = 0 | 1; // 0 = white, 1 = black

export type FBHRecursiveIndexes = [
  recursiveHistoryIndex: -1 | FBHRecursiveIndex, // '-1' = end of history
  paralelBranchesIndex?: number // Defaults to 0 (root), '-1' = apends?
];

export type FBHRecursiveIndex =
  | [
      turn: number, // 0, 1, 2, 3
      move: FBHIndexMovePosition,
      recursiveIndexes?: FBHRecursiveIndexes
    ];

export type FBHNonRecursiveIndex = [
  turn: number, // 0, 1, 2, 3
  move: FBHIndexMovePosition
];

export type FBHIndex = FBHRecursiveIndex;
