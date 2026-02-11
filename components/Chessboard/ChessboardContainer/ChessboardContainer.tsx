import React, { useCallback } from 'react';
import {
  ChessFEN,
  PieceSan,
  ShortChessMove,
  ChessColor,
} from '@/lib/ChessRouler';
import { Square } from 'chess.js';
import { useArrowAndCircleColor } from '../hooks/useArrowAndCircleColor';
import { ArrowsMap, CircleDrawTuple, CirclesMap } from '../types';
import { noop } from 'movex-core-util';
import { ChessboardSquare } from './ChessboardSquare';
import { BoardTheme } from '@/hooks/useTheme/defaultTheme';
import { useCustomArrows } from './hooks/useArrows';
import { useCustomStyles } from './hooks/useCustomStyles';
import { ChessboardDisplay, ChessboardDisplayProps } from './ChessboardDisplay';
import { useMoves } from './hooks/useMoves';

export type ChessboardContainerProps = Omit<
  ChessboardDisplayProps,
  | 'onArrowsChange'
  | 'boardOrientation'
  | 'onPieceDrop'
  | 'onCancelPromoMove'
  | 'onSubmitPromoMove'
> & {
  fen: ChessFEN;
  sizePx: number;
  boardTheme: BoardTheme;

  // Move
  onValidateMove?: (m: ShortChessMove) => boolean;
  onMove: (m: ShortChessMove) => void;

  arrowsMap?: ArrowsMap;
  circlesMap?: CirclesMap;
  arrowColor?: string;
  lastMove?: ShortChessMove;
  boardOrientation?: ChessColor;
  containerClassName?: string;

  onPieceDrop?: (from: Square, to: Square, piece: PieceSan) => void;
  onArrowsChange?: (arrows: ArrowsMap) => void;
  onCircleDraw?: (circleTuple: CircleDrawTuple) => void;
  onClearCircles?: () => void;

  overlayComponent?: React.ReactNode;
} & (
    | {
        rightSideComponent: React.ReactNode;
        rightSideSizePx: number;
        rightSideClassName?: string;
      }
    | {
        rightSideComponent?: undefined;
        rightSideSizePx?: undefined;
        rightSideClassName?: undefined;
      }
  ) &
  (
    | {
        // When this is true the player can only touch the pieces on her side
        strict: true;
        turn: ChessColor;
      }
    | {
        strict?: false;
        turn?: ChessColor;
      }
  );

const BOARD_ANIMATION_DELAY = 200;

export const ChessboardContainer: React.FC<ChessboardContainerProps> = ({
  fen,
  lastMove,
  strict,
  circlesMap,
  onArrowsChange = noop,
  onCircleDraw = noop,
  onClearCircles = noop,
  onPieceDrop,
  onMove,
  onValidateMove = () => true, // Defaults to always be able to move
  boardOrientation = 'w',
  customSquareStyles,
  rightSideComponent,
  rightSideSizePx = 0,
  rightSideClassName,
  boardTheme,
  sizePx,
  turn,
  overlayComponent,
  ...props
}) => {
  const isMyTurn = boardOrientation === turn;

  // Arrows
  const arrowAndCircleColor = useArrowAndCircleColor();
  const customArrows = useCustomArrows(onArrowsChange, props.arrowsMap);

  // Circles
  const drawCircle = useCallback(
    (sq: Square) => {
      onCircleDraw([sq, arrowAndCircleColor]);
    },
    [onCircleDraw, arrowAndCircleColor],
  );

  const resetArrowsAndCircles = () => {
    // Reset the Arrows and Circles if present
    if (Object.keys(circlesMap || {}).length > 0) {
      onClearCircles();
    }

    if (Object.keys(props.arrowsMap || {}).length > 0) {
      // Reset the arrows on square click
      onArrowsChange({});
    }
  };

  // Moves
  const { preMove, promoMove, pendingMove, ...moveActions } = useMoves({
    playingColor: boardOrientation,
    isMyTurn,
    premoveAnimationDelay: BOARD_ANIMATION_DELAY + 1,
    onValidateMove,
    onMove,
    onPreMove: onMove,

    // Event to reset the circles and arrows when any square is clicked or dragged
    onSquareClickOrDrag: resetArrowsAndCircles,
  });

  // Styles
  const customStyles = useCustomStyles({
    boardTheme,
    fen,
    lastMove,
    pendingMove,
    preMove,
    circlesMap,
    isMyTurn,
    customSquareStyles,
    ...props,
  });

  if (sizePx === 0) {
    return null;
  }

  return (
    <ChessboardDisplay
      fen={fen}
      sizePx={sizePx}
      boardTheme={boardTheme}
      boardOrientation={boardOrientation}
      // Moves
      onPieceDragBegin={moveActions.onPieceDrag}
      onSquareClick={moveActions.onSquareClick}
      onPieceDrop={moveActions.onPieceDrop}
      // Promo Move
      promoMove={promoMove}
      onCancelPromoMove={moveActions.onClearPromoMove}
      onSubmitPromoMove={onMove}
      // Overlay & Right Components
      rightSideClassName={rightSideClassName}
      rightSideComponent={rightSideComponent}
      rightSideSizePx={rightSideSizePx}
      overlayComponent={overlayComponent}
      // Board Props
      customBoardStyle={customStyles.customBoardStyle}
      customLightSquareStyle={customStyles.customLightSquareStyle}
      customDarkSquareStyle={customStyles.customDarkSquareStyle}
      customSquareStyles={customStyles.customSquareStyles}
      customSquare={ChessboardSquare as any} // TODO: Fix "any" Introduced in the upgrade to chessroulette-next on Feb 11 2026
      // onMouseOverSquare={setHoveredSquare}
      // Arrows
      customArrowColor={arrowAndCircleColor}
      customArrows={customArrows.arrowsToRender}
      onArrowsChange={customArrows.updateArrowsMap}
      // circles
      onSquareRightClick={drawCircle}
      customPieces={boardTheme.customPieces}
      animationDuration={BOARD_ANIMATION_DELAY}
      {...props}
    />
  );
};
