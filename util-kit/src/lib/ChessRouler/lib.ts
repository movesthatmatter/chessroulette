import { Err, Ok, Result } from 'ts-results';
import { PieceSymbol, Square, Chess } from 'chess.js';
import { Arrow } from 'react-chessboard/dist/chessboard/types';
import {
  BlackColor,
  ChessArrowId,
  ChessColor,
  ChessFEN,
  ChessMove,
  ChessPGN,
  GameOverReason,
  LongChessColor,
  ShortChessColor,
  WhiteColor,
} from './types';
import {
  ChessFENBoard,
  fenBoardPieceSymbolToPieceSymbol,
} from '../ChessFENBoard';
import { getRandomInt } from '../misc';

export const isShortChessColor = (s: string): s is ShortChessColor =>
  s === 'b' || s === 'w';

export const isLongChessColor = (s: string): s is LongChessColor =>
  s === 'black' || s === 'white';

export const isChessColor = (s: string): s is ChessColor =>
  isShortChessColor(s) || isLongChessColor(s);

export const toShortColor = (c: ChessColor): ShortChessColor =>
  c[0] as ShortChessColor;

export const toLongColor = (c: ChessColor): LongChessColor =>
  c === 'b' || c === 'black' ? 'black' : 'white';

export const isWhiteColor = (c: ChessColor): c is WhiteColor =>
  toShortColor(c) === 'w';

export const isBlackColor = (c: ChessColor): c is BlackColor =>
  toShortColor(c) === 'b';

export const areColorsEqual = (a: ChessColor, b: ChessColor) =>
  toShortColor(a) === toShortColor(b);

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

// export const isMoveValid = (instance: Chess, move: ChessMove) => {
//   instance.undo

//   try {
//     instance.move(localChessMoveToChessLibraryMove(move));

//     return true;
//   } catch (e) {
    
//     return prev;
//   }
// }

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

export const getRandomColor = (): ShortChessColor =>
  (['w', 'b'] as const)[getRandomInt(0, 1)];

// export const checkIsGameOverWithReason = (
//   instance: Chess,
//   hasTimedOut: boolean
// ): Result<[reason: GameOverReason, isDraw: boolean], void> => {
//   if (hasTimedOut) {
//     console.log(
//       'has timed out, but has insufficient material', instance.turn(),
//       hasInsufficientMaterialToForceMate(instance.turn(), instance.fen())
//     );

//     // if () {
//     //   return new Ok([GameOverReason['insufficientMaterial'], instance.isDraw()]);
//     // }

//     return new Ok([GameOverReason['timeout'], false]);
//   }

//   if (instance.isCheckmate()) {
//     return new Ok([GameOverReason['checkmate'], instance.isDraw()]);
//   }

//   if (instance.isDraw()) {
//     return new Ok([GameOverReason['draw'], true]);
//   }

//   if (instance.isInsufficientMaterial()) {
//     return new Ok([GameOverReason['insufficientMaterial'], instance.isDraw()]);
//   }

//   if (instance.isStalemate()) {
//     return new Ok([GameOverReason['stalemate'], instance.isDraw()]);
//   }

//   if (instance.isThreefoldRepetition()) {
//     return new Ok([GameOverReason['threefoldRepetition'], instance.isDraw()]);
//   }

//   return Err.EMPTY;
// };
