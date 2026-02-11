import { ShortChessMove } from '@/lib/ChessRouler';
import { GetComponentProps } from '@/lib/misc';
import { Piece, Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';

export type ReactChessBoardProps = GetComponentProps<typeof Chessboard>;

export type ChessboardShortMoveWithPiece = ShortChessMove & { piece: Piece };

export type ChessBoardPendingMove = {
  from: Square;
  piece: Piece;
  to?: Square;
};

export type ChessboardPreMove =
  | ChessBoardPendingMove
  | Required<ChessBoardPendingMove>;

