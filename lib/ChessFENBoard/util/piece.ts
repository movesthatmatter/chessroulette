import { Color, Piece, PieceSymbol } from 'chess.js';
import {
  FenBoardPieceSymbol,
  FenBoardPromotionalPieceSymbol,
  FenBoardDetailedChessMove,
} from '../types';
import {
  ChessColor,
  DetailedChessMove,
  PieceSan,
  PromotionalPieceSan,
} from '../../ChessRouler';
import { isOneOf } from '../../misc';
import { isUpperCase } from './misc';

// From FenBoardPieceSymbol

export const fenBoardPieceSymbolToDetailedChessPiece = (
  p: FenBoardPieceSymbol
): Piece => ({
  type: p.toLowerCase() as PieceSymbol,
  color: isUpperCase(p) ? 'w' : 'b',
});

export const isPieceSymbolOfColor = (color: Color, p: FenBoardPieceSymbol) =>
  color === 'w' ? isUpperCase(p) : !isUpperCase(p);

export const fenBoardPieceSymbolToPieceSymbol = (
  p: FenBoardPieceSymbol
): PieceSymbol => p.toLowerCase() as PieceSymbol;

// From Piece

export const pieceToPieceSan = (p: Piece): PieceSan =>
  `${p.color[0]}${p.type.toLocaleUpperCase()}}` as PieceSan;

export const pieceToFenBoardPieceSymbol = (p: {
  type: PieceSymbol;
  color: Color;
}): FenBoardPieceSymbol => pieceSanToPieceSymbol(pieceToPieceSan(p));

// From PieceSan

export const pieceSanToFenBoardPieceSymbol = (
  p: PieceSan
): FenBoardPieceSymbol => {
  const { color, type } = pieceSanToPiece(p);

  return (
    color === 'b' ? type.toLowerCase() : type.toUpperCase()
  ) as FenBoardPieceSymbol;
};

export const promotionalPieceSanToFenBoardPromotionalPieceSymbol = (
  p: PromotionalPieceSan
): FenBoardPromotionalPieceSymbol =>
  pieceSanToFenBoardPieceSymbol(p) as FenBoardPromotionalPieceSymbol;

export const pieceSanToPieceSymbol = (p: PieceSan): PieceSymbol =>
  fenBoardPieceSymbolToPieceSymbol(pieceSanToFenBoardPieceSymbol(p));

export const pieceSanToPiece = (p: PieceSan): Piece => ({
  color: p[0] as ChessColor,
  type: p[1].toLowerCase() as PieceSymbol,
});

// Checks

export const isFenBoardPromotionalPieceSymbol = (
  p: FenBoardPieceSymbol
): p is FenBoardPromotionalPieceSymbol => !isOneOf(p, ['K', 'k', 'p', 'P']);

// Moves

// From FreeBoardDetailedChessMove

// export const freeBoardDetailedChessMoveToDetailedChessMove = (
//   m: FreeBoardDetailedChessMove
// ): DetailedChessMove => ({
//   from: m.from,
//   to: m.to,
//   san: m.san,
//   piece: fenBoardPieceSymbolToPieceSymbol(m.piece),
//   color: m.color,
//   ...(m.captured && { captured: fenBoardPieceSymbolToPieceSymbol(m.captured) }),
//   ...(m.promoteTo && {
//     promotion: fenBoardPieceSymbolToPieceSymbol(m.promoteTo),
//   }),
// });

export const detailedChessMoveToFreeBoardDetailedChessMove = (
  m: DetailedChessMove
): FenBoardDetailedChessMove => ({
  from: m.from,
  to: m.to,
  san: m.san,
  piece: fenBoardPieceSymbolToPieceSymbol(m.piece),
  color: m.color,
  ...(m.captured && { captured: fenBoardPieceSymbolToPieceSymbol(m.captured) }),
  ...(m.promotion && {
    promotion: fenBoardPieceSymbolToPieceSymbol(m.promotion),
  }),
});
