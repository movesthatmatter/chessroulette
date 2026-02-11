import type { Color, PieceSymbol, Square } from 'chess.js';
import { BlackColor, ChessColor, WhiteColor, ShortChessMove } from '../ChessRouler';
import type { Matrix } from '../matrix';

export type AbsoluteCoord = {
  x: number;
  y: number;
};

export type RelativeCoord = {
  row: number;
  col: number;
};

export type FenBoardPieceSymbol = PieceSymbol | Uppercase<PieceSymbol>;
export type FenBoardPromotionalPieceSymbol = Exclude<
  FenBoardPieceSymbol,
  'K' | 'k' | 'p' | 'P'
>;

export type FENBoard = Matrix<FenBoardPieceSymbol | ''>;

export type ChessBoard = Matrix<{
  square: Square;
  type: PieceSymbol;
  color: Color;
} | null>;

export type BaseFenBoardDetailedChessMove = ShortChessMove & {
  color: ChessColor;
  piece: FenBoardPieceSymbol;
  captured?: FenBoardPieceSymbol;
  san: string;
};

export type WhiteFenBoardDetailedChessMove = BaseFenBoardDetailedChessMove & {
  color: WhiteColor;
};

export type BlackFenBoardDetailedChessMove = BaseFenBoardDetailedChessMove & {
  color: BlackColor;
};

export type FenBoardDetailedChessMove =
  | WhiteFenBoardDetailedChessMove
  | BlackFenBoardDetailedChessMove;
