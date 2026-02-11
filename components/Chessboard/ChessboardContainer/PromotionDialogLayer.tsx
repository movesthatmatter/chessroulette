import {
  ChessColor,
  isBlackColor,
  PromotionalPieceSan,
  ShortChessColor,
} from '@/lib/ChessRouler';
import {
  flipBoardCoords,
  getSquareSize,
  squareToBoardCoards,
} from '@/lib/ChessFENBoard';
import { Square } from 'chess.js';
import React, { useMemo } from 'react';
import { objectKeys } from '@/lib/misc';

export type PromotionDialogLayerProps = {
  boardSizePx: number;
  boardOrientation: ChessColor;
  promotionSquare: Square;
  onPromotePiece: (p: PromotionalPieceSan) => void;
  onCancel: () => void;
  renderPromotablePiece: (p: {
    pieceSan: PromotionalPieceSan;
    squareWidth: number;
    isFlipped: boolean;
  }) => React.ReactNode;
};

const promotablePiecesMapWithDisplayOrder: Record<PromotionalPieceSan, number> =
  {
    wQ: 1,
    wR: 2,
    wN: 3,
    wB: 4,

    bQ: 1,
    bR: 2,
    bN: 3,
    bB: 4,
  };

export const PromotionDialogLayer: React.FC<PromotionDialogLayerProps> = ({
  boardOrientation,
  boardSizePx,
  promotionSquare,
  onPromotePiece,
  onCancel,
  renderPromotablePiece,
}) => {
  const squareSize = useMemo(() => getSquareSize(boardSizePx), [boardSizePx]);

  const promotingColor: ShortChessColor =
    Number(promotionSquare[1]) === 1 ? 'b' : 'w';

  const isFlipped = promotingColor !== boardOrientation;

  const dialogHorizontalPosition = useMemo(() => {
    const rawCoords = squareToBoardCoards(promotionSquare);

    // When the orientation is black the coords need to be flipped on "col" axis
    const coords = isBlackColor(boardOrientation)
      ? flipBoardCoords(rawCoords)
      : rawCoords;

    return coords.col * squareSize;
  }, [promotionSquare, squareSize, boardOrientation]);

  const piecesListRender = useMemo(() => {
    const piecesAsListInOrder = objectKeys(promotablePiecesMapWithDisplayOrder)
      .map(
        (san) =>
          ({
            color: san[0] as ShortChessColor,
            san,
            asset: promotablePiecesMapWithDisplayOrder[san],
          }) as const,
      )
      .filter((p) => p.color === promotingColor)
      .sort(
        (a, b) =>
          promotablePiecesMapWithDisplayOrder[a.san] -
          promotablePiecesMapWithDisplayOrder[b.san],
      );

    return piecesAsListInOrder.map((p) => (
      <span
        key={p.san}
        role="presentation"
        onClick={() => onPromotePiece(p.san)}
        className="hover:bg-slate-400"
      >
        {renderPromotablePiece({
          pieceSan: p.san,
          squareWidth: squareSize,
          isFlipped,
        })}
      </span>
    ));
  }, [promotionSquare, isFlipped, squareSize, onPromotePiece]);

  return (
    <div
      className="absolute inset-0 z-50"
      style={{ background: `rgba(0, 0, 0, .5)` }}
      onClick={onCancel}
    >
      <div
        className="absolute bg-white"
        style={{
          left: dialogHorizontalPosition,
          ...(isFlipped ? { bottom: 0 } : { top: 0 }),
        }}
      >
        <div
          className={`text-center cursor-pointer flex ${
            isFlipped ? 'flex-col-reverse' : 'flex-col'
          }`}
          style={{ width: squareSize }}
        >
          {piecesListRender}
        </div>
      </div>
    </div>
  );
};
