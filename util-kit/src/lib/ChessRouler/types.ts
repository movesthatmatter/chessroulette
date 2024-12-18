import type { Square, Move, PieceSymbol } from 'chess.js';
import { FenBoardPromotionalPieceSymbol } from '../ChessFENBoard';

// Remove in favor of ShortChessMove
export type ChessMove = {
  from: Square;
  to: Square;
  promoteTo?: FenBoardPromotionalPieceSymbol;
};

export type ShortChessMove = {
  from: Square;
  to: Square;
  promoteTo?: FenBoardPromotionalPieceSymbol;
};

export type DetailedChessMove = Pick<
  Move,
  'color' | 'san' | 'to' | 'from' | 'piece' | 'captured' | 'promotion'
>;

export type ChessPGN = string; // TODO: Brand this type
export type ChessFEN = string; // TODO: Brand this type

// This idea is 100% borrowed from this article:
//  https://spin.atomicobject.com/2017/06/19/strongly-typed-date-string-typescript/
// It works pretty nice o be able to take a string and brand with a nominal type!
// Also see https://basarat.gitbooks.io/typescript/docs/tips/nominalTyping.html
export enum ChessFENStateNotationBrand {
  _ = '',
}
export type ChessFENStateNotation = ChessFENStateNotationBrand & string;

export type ChessMoveSan = string; // TODO: Brand this type

export type WhiteShortColor = 'w';
export type BlackShortColor = 'b';

export type WhiteLongColor = 'white';
export type BlackLongColor = 'black';

export type WhiteColor = WhiteShortColor | WhiteLongColor;
export type BlackColor = BlackShortColor | BlackLongColor;

export type LongChessColor = WhiteLongColor | BlackLongColor;
export type ShortChessColor = WhiteShortColor | BlackShortColor;

export type ChessSide = 'home' | 'away';

export type ChessColor = WhiteColor | BlackColor;

export type DetailedChessPiece = {
  piece: PieceSymbol;
  color: ShortChessColor;
};

export type PieceSan =
  | 'wP'
  | 'wB'
  | 'wN'
  | 'wR'
  | 'wQ'
  | 'wK'
  | 'bP'
  | 'bB'
  | 'bN'
  | 'bR'
  | 'bQ'
  | 'bK';

export type PromotionalPieceSan = Exclude<PieceSan, 'wP' | 'wK' | 'bP' | 'bK'>;

// export type ChessArrowId = `${Square}${Square}-${string}`;
export type ChessArrowId = string;
export type ChessCircleId = string;

export enum GameOverReason {
  'timeout',
  'checkmate',
  'draw',
  'stalemate',
  'insufficientMaterial',
  'threefoldRepetition',
  'resignation',
  'acceptedDraw',
  'aborted',
}
