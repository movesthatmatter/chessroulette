import { ChessColor, ChessFEN, ChessPGN, pgnToFen } from '@/lib/ChessRouler';
import { ChessFENBoard } from '@/lib/ChessFENBoard';
import { GameDisplayState } from '../types';
import { FBHHistory, FBHIndex, FreeBoardHistory } from '@/lib/FreeBoardHistory';

const getLastMove = (history: FBHHistory, atIndex: FBHIndex) => {
  const lm = FreeBoardHistory.findMoveAtIndex(history, atIndex);

  return lm?.isNonMove ? undefined : lm;
};

export const getGameDisplayState = ({
  pgn,
  focusedIndex,
}: {
  pgn: ChessPGN;
  focusedIndex?: FBHIndex;
}): GameDisplayState => {
  const allHistory = FreeBoardHistory.pgnToHistory(pgn);

  if (!focusedIndex) {
    const lastFocusedIndex = FreeBoardHistory.getLastIndexInHistory(allHistory);

    const fen = pgnToFen(pgn);

    return {
      fen,
      history: allHistory,
      focusedIndex: FreeBoardHistory.getLastIndexInHistory(allHistory),
      lastMove: getLastMove(allHistory, lastFocusedIndex),
      turn: getTurnFromFen(fen),
    } as const;
  }

  const [historyAtIndex, lastFocusedIndex] = FreeBoardHistory.sliceHistory(
    allHistory,
    FreeBoardHistory.incrementIndex(focusedIndex),
  );

  const fen = FreeBoardHistory.historyToFen(historyAtIndex);

  return {
    fen,
    history: allHistory,
    focusedIndex: lastFocusedIndex,
    lastMove: getLastMove(historyAtIndex, lastFocusedIndex),
    turn: getTurnFromFen(fen),
  };
};

export const getTurnFromPgn = (pgn: ChessPGN): ChessColor =>
  getTurnFromFen(pgnToFen(pgn));

export const getTurnFromFen = (fen: ChessFEN): ChessColor =>
  new ChessFENBoard(fen).getFenState().turn;
