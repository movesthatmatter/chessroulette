import {
  ChessFENBoard,
  ChessPGN,
  FBHHistory,
  FBHIndex,
  FreeBoardHistory,
  LongChessColor,
  pgnToFen,
  swapColor,
  toLongColor,
} from '@xmatter/util-kit';
import { GameDisplayState } from '../types';
import { Game } from '../store';

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
      turn: toLongColor(new ChessFENBoard(fen).getFenState().turn),
    } as const;
  }

  const [historyAtIndex, lastFocusedIndex] = FreeBoardHistory.sliceHistory(
    allHistory,
    FreeBoardHistory.incrementIndex(focusedIndex)
  );

  const fen = FreeBoardHistory.historyToFen(historyAtIndex);

  return {
    fen,
    history: allHistory,
    focusedIndex: lastFocusedIndex,
    lastMove: getLastMove(historyAtIndex, lastFocusedIndex),
    turn: toLongColor(new ChessFENBoard(fen).getFenState().turn),
  };
};

export const getGameTurn = (pgn: ChessPGN): LongChessColor =>
  toLongColor(new ChessFENBoard(pgnToFen(pgn)).getFenState().turn);

export const calculateGameTimeLeftAt = (at: number, game: Game) => {
  // If the game is not ongoing then simply return the existent timeLeft
  if (game.status !== 'ongoing') {
    return game.timeLeft;
  }

  // Otherwise calcualte the diff

  const lastGameActivityAt = game.lastMoveAt || game.startedAt;
  const turn = toLongColor(swapColor(game.lastMoveBy));
  const msSinceLastGameActivity = at - lastGameActivityAt;

  return {
    ...game.timeLeft,
    [turn]: game.timeLeft[turn] - msSinceLastGameActivity,
  };
};
