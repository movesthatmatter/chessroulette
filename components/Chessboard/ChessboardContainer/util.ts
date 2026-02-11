import { toDictIndexedBy } from '@/lib/misc';
import { SquareMap } from '../types';
import { Square } from 'chess.js';
import { ChessFENBoard } from '@/lib/ChessFENBoard';
import { ChessFEN, getNewChessGame } from '@/lib/ChessRouler';

// TODO: This can be done at the history level
export const getInCheckSquareMap = (fen: ChessFEN): SquareMap => {
  let result: Square[] = [];

  const fenBoardInstance = new ChessFENBoard(fen);

  fenBoardInstance.setFenState({ turn: 'w', enPassant: undefined });

  const fenAsWhiteTurn = fenBoardInstance.fen;

  fenBoardInstance.setFenState({ turn: 'b', enPassant: undefined });

  const fenAsBlackTurn = fenBoardInstance.fen;

  const chessInstanceAsWhite = getNewChessGame({
    fen: fenAsWhiteTurn,
  });

  if (chessInstanceAsWhite.isCheck()) {
    const whiteKingSquare = fenBoardInstance.getKingSquare('w');

    if (whiteKingSquare) {
      result = [whiteKingSquare];
    }
  }

  const chessInstanceAsBlack = getNewChessGame({
    fen: fenAsBlackTurn,
  });

  if (chessInstanceAsBlack.isCheck()) {
    const blackKingSquare = fenBoardInstance.getKingSquare('b');

    if (blackKingSquare) {
      result = [...result, blackKingSquare];
    }
  }

  return toDictIndexedBy(
    result,
    (sq) => sq,
    () => undefined,
  ) as SquareMap;
};
