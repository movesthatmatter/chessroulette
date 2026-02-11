import {
  ChessFEN,
  ChessMove,
  ShortChessColor,
  getNewChessGame,
  localChessMoveToChessLibraryMove,
} from '@/lib/ChessRouler';

export const validateMove = (
  move: ChessMove,
  fen: ChessFEN,
  playingColor: ShortChessColor,
):
  | {
      valid: false;
    }
  | {
      valid: true;
      fen: ChessFEN;
    } => {
  const chess = getNewChessGame({ fen });

  // Validate Turn
  if (chess.turn() !== playingColor) {
    return {
      valid: false,
    };
  }

  // Validate move
  try {
    chess.move(localChessMoveToChessLibraryMove(move));

    return {
      valid: true,
      fen: chess.fen(),
    };
  } catch (e) {
    return { valid: false };
  }
};
