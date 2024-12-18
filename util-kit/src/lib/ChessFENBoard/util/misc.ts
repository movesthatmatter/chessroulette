import { Piece } from 'chess.js';
import type {
  BlackLongColor,
  BlackShortColor,
  ChessColor,
  ChessMove,
  LongChessColor,
  ShortChessColor,
  WhiteLongColor,
  WhiteShortColor,
} from '../../ChessRouler';
import { isShortChessColor } from '../../ChessRouler';

export const isPromotableMove = (m: ChessMove, piece: Piece) => {
  return (
    piece.type === 'p' && // is pawn
    ((piece.color === 'w' && m.to[1] === '8') || // when white is on the 8th rank
      (piece.color === 'b' && m.to[1] === '1')) // when black is on the 1st rank
  );
};

export function swapColor<C extends LongChessColor>(
  c: C
): C extends LongChessColor ? BlackLongColor : WhiteLongColor;
export function swapColor<C extends ShortChessColor>(
  c: C
): C extends ShortChessColor ? BlackShortColor : WhiteShortColor;
export function swapColor<C extends ChessColor>(
  c: C
): C extends LongChessColor ? BlackLongColor : WhiteLongColor;
export function swapColor<C extends ChessColor>(
  c: C
): C extends ShortChessColor ? BlackShortColor : WhiteShortColor;
export function swapColor<C extends ChessColor>(c: C) {
  if (isShortChessColor(c)) {
    return c === 'w' ? 'b' : 'w';
  } else {
    return c === 'white' ? 'black' : 'white';
  }
}

export const isUpperCase = (s: string) => s === s.toUpperCase();
