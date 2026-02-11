import { useEffect, useState } from 'react';
import type {
  ChessBoardPendingMove,
  ChessboardPreMove,
  ChessboardShortMoveWithPiece,
} from '../types';
import {
  PieceSan,
  ShortChessColor,
  ShortChessMove,
} from '@/lib/ChessRouler';
import { Square } from 'chess.js';
import { Err, Ok, Result } from 'ts-results';
import { isPromotableMove, pieceSanToPiece } from '@/lib/ChessFENBoard';

type Props = {
  isMyTurn: boolean;
  // This is the color than can move the pieces
  playingColor: ShortChessColor;

  // This is needed in order for the board animation to not get choppy
  premoveAnimationDelay?: number;

  onMove: (m: ShortChessMove) => void;
  onPreMove?: (m: ShortChessMove) => void;
  onValidateMove: (m: ShortChessMove) => boolean;

  onSquareClickOrDrag?: () => void;
};

export const useMoves = ({
  isMyTurn,
  playingColor,
  premoveAnimationDelay = 151,
  onMove,
  onPreMove,
  onValidateMove,
  onSquareClickOrDrag,
}: Props) => {
  const [pendingMove, setPendingMove] = useState<ChessBoardPendingMove>();
  const [promoMove, setPromoMove] = useState<ShortChessMove>();

  // pre move
  const allowsPremoves = !!onPreMove;
  const [preMove, setPreMove] = useState<ChessboardPreMove>();

  // Promo Move calling
  useEffect(() => {
    // If the premove is not active cannot move
    if (!onPreMove) {
      return;
    }

    // If it's not my turn cannot move
    if (!isMyTurn) {
      return;
    }

    if (preMove && preMove.to) {
      const { to } = preMove;

      setTimeout(() => {
        setPreMove(undefined);
        onPreMove({ ...preMove, to });
        // For some reason it it's not waiting 300ms, the animatino is choppy
      }, premoveAnimationDelay);
    }
  }, [isMyTurn, preMove, allowsPremoves, onPreMove]);

  const onMoveIfValid = (m: ShortChessMove): Result<void, void> => {
    if (onValidateMove(m)) {
      onMove(m);

      return Ok.EMPTY;
    }

    return Err.EMPTY;
  };

  const isValidPromoMove = (m: ChessboardShortMoveWithPiece) =>
    isPromotableMove(m, m.piece) &&
    onValidateMove({
      ...m,
      promoteTo: 'q',
    });

  const onClickOrDrag = ({
    square,
    pieceSan,
  }: {
    square: Square;
    pieceSan?: PieceSan;
  }) => {
    onSquareClickOrDrag?.();

    const piece = pieceSan ? pieceSanToPiece(pieceSan) : undefined;
    const isMyPiece = piece?.color === playingColor;

    // Premoves
    // TODO: Shuld I have other checks like it's my piece etc?
    if (allowsPremoves && !isMyTurn) {
      // When there's no premove and the square is a piece, set it
      if (preMove) {
        if (preMove.from === square) {
          // Reset it if same square
          setPreMove(undefined);
        } else if (piece && isMyPiece) {
          // If clicking on my piece, just reset it to that piece
          setPreMove({ from: square, piece });
        } else {
          // Otherwise finish the premove
          setPreMove({
            ...preMove,
            to: square,
          });
        }
      } else if (!preMove && piece && isMyPiece) {
        // When there is a premove it doesn't matter if the square is a piece (capture) or not
        setPreMove({ from: square, piece });
      }
    }

    // If there is no existent Pending Move ('from' set)
    else if (!pendingMove?.from) {
      // If there none of myPieces on the square return early
      if (!isMyPiece) {
        return;
      }

      setPendingMove({ from: square, piece });
      return;
    }

    // Otherwise If there is an existent Pending Move without the 'to' set
    else if (!pendingMove?.to) {
      // Return early if the from and to square are the same
      if (square === pendingMove.from) {
        setPendingMove(undefined);
        return;
      }

      // Simply change the pending moves if the same side
      else if (piece?.color === pendingMove.piece.color) {
        setPendingMove({
          piece,
          from: square,
        });
        return;
      }

      // Check if Promo Move
      else if (
        isValidPromoMove({
          ...pendingMove,
          to: square,
        })
      ) {
        setPromoMove({ ...pendingMove, to: square });
        return;
      }

      // Otherwise simply move
      else {
        onMoveIfValid({ from: pendingMove.from, to: square }).map(() => {
          setPendingMove(undefined);
        });
      }
    }
  };

  const onPieceDrop = (from: Square, to: Square, pieceSan: PieceSan) => {
    // Check for premoves first
    if (preMove) {
      setPreMove({ ...preMove, to });

      // As this is not yet a valid move, return false
      return false;
    }

    setPendingMove(undefined);

    // Check first if vald Promo Move
    if (isValidPromoMove({ from, to, piece: pieceSanToPiece(pieceSan) })) {
      setPromoMove({ from, to });
      return true;
    }

    // Otherwie simply move
    return onMoveIfValid({ from, to }).ok;
  };

  return {
    onSquareClick: (square: Square, pieceSan?: PieceSan) =>
      onClickOrDrag({ square, pieceSan }),
    onPieceDrag: (pieceSan: PieceSan, square: Square) =>
      onClickOrDrag({ square, pieceSan }),
    onPieceDrop,
    onClearPromoMove: () => setPromoMove(undefined),
    promoMove,
    pendingMove,
    preMove,
  };
};
