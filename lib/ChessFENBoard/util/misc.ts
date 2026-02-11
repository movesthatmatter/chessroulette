import { Piece } from 'chess.js';
import type {
  BlackColor,
  ChessColor,
  ChessMove,
  WhiteColor,
} from '../../ChessRouler';

export const isPromotableMove = (m: ChessMove, piece: Piece) => {
  return (
    piece.type === 'p' && // is pawn
    ((piece.color === 'w' && m.to[1] === '8') || // when white is on the 8th rank
      (piece.color === 'b' && m.to[1] === '1')) // when black is on the 1st rank
  );
};

export function swapColor<C extends ChessColor>(
  c: C
): C extends ChessColor ? WhiteColor : BlackColor;
export function swapColor<C extends ChessColor>(c: C) {
  return c === 'w' ? 'b' : 'w';
}

export const isUpperCase = (s: string) => s === s.toUpperCase();
