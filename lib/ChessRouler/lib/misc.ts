import { PieceSymbol, Square, Chess } from 'chess.js';
import { Arrow } from 'react-chessboard/dist/chessboard/types';
import { ChessArrowId, ChessFEN, ChessMove, ChessPGN } from '../types';
import { fenBoardPieceSymbolToPieceSymbol } from '../../ChessFENBoard';

export const isDarkSquare = (s: Square): boolean => {
  const [file, rank] = s;

  // 97 is chardCodeAt of 'a'
  return (file.charCodeAt(0) - 97 + Number(rank)) % 2 === 1;
};

export const isLightSquare = (s: Square): boolean => !isDarkSquare(s);

export const toChessArrowId = ([from, to, color]: Arrow): ChessArrowId =>
  `${from}${to}-${color}`;

export const toChessArrowFromId = (aid: ChessArrowId): Arrow => {
  const from = aid.slice(0, 2) as Square;
  const to = aid.slice(2, 4) as Square;
  const color = aid.slice(5) as string;

  return [from, to, color];
};

// @deprecate in favor of ChessRouler
export const getNewChessGame = (
  props?:
    | { pgn: ChessPGN; fen?: undefined }
    | { fen: ChessFEN; pgn?: undefined }
) => {
  const instance = new Chess();

  try {
    if (props?.pgn) {
      instance.loadPgn(props.pgn);

      return instance;
    }

    if (props?.fen) {
      instance.load(props.fen);

      return instance;
    }

    return instance;
  } catch (e) {
    console.error('GetNewChessGame', e);
    return instance;
  }
};

export const isValidPgn = (s: string): s is ChessPGN => {
  const instance = new Chess();

  try {
    instance.loadPgn(s);

    return true;
  } catch {
    return false;
  }
};

type ChessLibraryMove = {
  from: Square;
  to: Square;
  promotion?: PieceSymbol;
};

export const isValidFen = (s: string): s is ChessFEN => {
  const instance = new Chess();

  try {
    instance.loadPgn(s);

    return true;
  } catch {
    return false;
  }
};

export const pgnToFen = (pgn: ChessPGN): ChessFEN =>
  getNewChessGame({ pgn }).fen();

/**
 * 
 *   //  * !!! deprecate !!! deprecate !!! deprecate !!! deprecate
  //  * deprecate the need for this!
  //  *
  //  * !!! This is an adapter for now but it should be removed in favor of using that directly
  //  *
  //  * @deprecate

 * This is an adapter for now but it should be removed in favor of using that directly
 *
 * @deprecate
 *
 * @param m
 * @returns
 */
export const localChessMoveToChessLibraryMove = ({
  from,
  to,
  promoteTo,
}: ChessMove): ChessLibraryMove => ({
  from,
  to,
  ...(promoteTo && { promotion: fenBoardPieceSymbolToPieceSymbol(promoteTo) }),
});
