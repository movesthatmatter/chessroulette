import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChessFENBoard,
  getSquareSize,
  pieceSanToFenBoardPieceSymbol,
} from '@/lib/ChessFENBoard';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Square } from 'chess.js';
import useInstance from '@use-it/instance';
import { DropContainer } from './DropContainer';
import { DraggableItem } from './DraggableItem';
import { IconButton } from '../Button';
import {
  ChessboardContainer,
  ChessboardContainerProps,
  ClearBoardIconButton,
  FlipBoardIconButton,
  StartPositionIconButton,
  useBoardTheme,
} from '../Chessboard';
import { ConfirmButton } from '../Button/ConfirmButton';
import { ChessFEN, isBlackColor, PieceSan } from '@/lib/ChessRouler';
import { objectKeys } from '@/lib/misc';

export type BoardEditorProps = Pick<
  ChessboardContainerProps,
  | 'boardOrientation'
  | 'arrowsMap'
  | 'onArrowsChange'
  | 'circlesMap'
  | 'onCircleDraw'
  | 'onClearCircles'
> & {
  fen: ChessFEN;
  onUpdateFen: (fen: ChessFEN) => void;
  onFlipBoard: () => void;
  sizePx: number;
} & (
    | {
        showSaveButtons: true;
        onCancel: () => void;
        onSave: () => void;
      }
    | {
        showSaveButtons?: false;
        onCancel: () => void;
        onSave: () => void;
      }
  );

const whitePieces: PieceSan[] = ['wP', 'wB', 'wN', 'wQ', 'wR'];
const blackPieces: PieceSan[] = ['bP', 'bB', 'bN', 'bQ', 'bR'];

export const BoardEditor = ({
  fen = ChessFENBoard.STARTING_FEN,
  sizePx,
  onUpdateFen,
  onFlipBoard,
  onCancel,
  onSave,
  showSaveButtons = true,
  ...props
}: BoardEditorProps) => {
  const [initialFen] = useState(fen);

  const fenBoard = useInstance<ChessFENBoard>(new ChessFENBoard(fen));
  const [draggingPieces, setDraggingPieces] = useState<
    Partial<Record<PieceSan, boolean>>
  >({});

  const isDragging = useMemo(
    () => objectKeys(draggingPieces).length > 0,
    [draggingPieces],
  );

  const { boardSize, squareSize } = useMemo(() => {
    const nextBoardSize = sizePx / 1.3;

    return {
      boardSize: nextBoardSize,
      squareSize: getSquareSize(nextBoardSize),
    };
  }, [sizePx]);

  useEffect(() => {
    fenBoard.loadFen(fen);
  }, [fen]);

  const boardTheme = useBoardTheme();
  const [hoveredSquare, setHoveredSquare] = useState<Square>();

  const onPieceDraggingStarted = useCallback(
    (pieceSan: PieceSan) => {
      if (!draggingPieces[pieceSan]) {
        setDraggingPieces((prev) => ({
          ...prev,
          [pieceSan]: true,
        }));
      }
    },
    [draggingPieces],
  );

  const onPieceDraggingStopped = useCallback(
    (pieceSan: PieceSan) => {
      if (draggingPieces[pieceSan]) {
        const { [pieceSan]: _removed, ...prevWithoutRemoved } = draggingPieces;

        setDraggingPieces(prevWithoutRemoved);
      }
    },
    [draggingPieces],
  );

  const renderPiece = useCallback(
    (pieceSan: PieceSan) => (
      <DraggableItem
        key={pieceSan}
        pieceSan={pieceSan}
        onDraggingStarted={onPieceDraggingStarted}
        onDraggingStopped={onPieceDraggingStopped}
        className="hover:cursor-pointer hover:bg-slate-500"
      >
        {boardTheme.renderPiece({ squareWidth: squareSize, pieceSan })}
      </DraggableItem>
    ),
    [
      boardTheme.renderPiece,
      onPieceDraggingStarted,
      onPieceDraggingStopped,
      squareSize,
    ],
  );

  const [draggedPieceState, setDraggedPieceState] = useState<{
    piece: PieceSan;
    from: Square;
    dropped: boolean;
  }>();

  const extraPiecesLayout = useMemo(() => {
    if (props.boardOrientation || 'w' === 'w') {
      return {
        top: blackPieces.map(renderPiece),
        bottom: whitePieces.map(renderPiece),
      };
    }

    return {
      bottom: blackPieces.map(renderPiece),
      top: whitePieces.map(renderPiece),
    };
  }, [props.boardOrientation, renderPiece, blackPieces, whitePieces]);

  const resetArrowsAndCircles = () => {
    props.onClearCircles?.();
    props.onArrowsChange?.({});
  };

  return (
    <div
      className="flex flex-col items-center justify-between gap-2 rounded-xl"
      style={{ height: sizePx }}
    >
      <DndProvider backend={HTML5Backend}>
        <div className="flex rounded-lg overflow-hidden bg-slate-600">
          {extraPiecesLayout.top}
        </div>
        <div className="flex justify-center" style={{ width: sizePx }}>
          <DropContainer
            isActive={isDragging}
            onHover={(_, square) => {
              setHoveredSquare(square);
            }}
            onDrop={(pieceSan, square) => {
              try {
                fenBoard.addPiece(
                  square,
                  pieceSanToFenBoardPieceSymbol(pieceSan),
                );

                onUpdateFen(fenBoard.fen);
                setHoveredSquare(undefined);
              } catch {
                // TODO: Maybe show an error in the UI
              }
            }}
            isFlipped={
              props.boardOrientation
                ? isBlackColor(props.boardOrientation)
                : false
            }
          >
            <ChessboardContainer
              fen={fen}
              boardTheme={boardTheme}
              {...props}
              onMove={(m) => {
                // Should this be part of the ChessFen or outside? The king not being removed
                // I think this should be after each clear, or move - because there is no valid FEN w/o the king

                try {
                  fenBoard.move(m);

                  onUpdateFen(fenBoard.fen);
                  setHoveredSquare(undefined);
                  return true;
                } catch (e) {
                  return false;
                }
              }}
              onPieceDragBegin={(piece, from) => {
                setDraggedPieceState({ piece, dropped: false, from });
              }}
              onPieceDrop={(from, to, piece) => {
                setDraggedPieceState({ piece, dropped: true, from });
                return true;
              }}
              onPieceDragEnd={(piece, from) => {
                if (
                  draggedPieceState?.piece === piece &&
                  draggedPieceState.dropped === false
                ) {
                  try {
                    fenBoard.clearSquare(from, { validate: true });

                    setDraggedPieceState(undefined);
                    onUpdateFen(fenBoard.fen);
                  } catch {
                    // TODO: Maybe show an error in the UI?
                  }
                }
              }}
              arePiecesDraggable
              allowDragOutsideBoard
              dropOffBoardAction="trash"
              sizePx={boardSize}
              customSquareStyles={{
                ...(hoveredSquare && {
                  [hoveredSquare]: {
                    boxShadow: `inset 0 0 5px 5px ${boardTheme.hoveredSquare}`,
                  },
                }),
              }}
            />
          </DropContainer>

          <div className="flex flex-col">
            <div className="flex flex-1 flex-col gap-2">
              {showSaveButtons && (
                <div>
                  <ConfirmButton
                    iconButton
                    icon="XCircleIcon"
                    type="custom"
                    tooltip="Cancel"
                    tooltipPositon="right"
                    className="text-slate-400 hover:text-white"
                    iconClassName="w-5 h-5"
                    confirmModalTitle="Cancel Changes"
                    confirmModalContent="You're about to cancel the changes. Are you sure?"
                    size="sm"
                    onClick={() => {
                      // Reset to the initial fen
                      onUpdateFen(initialFen);
                      // and then cancel
                      onCancel?.();
                    }}
                  />
                  <IconButton
                    icon="CheckCircleIcon"
                    type="custom"
                    tooltip="Use Position"
                    tooltipPositon="right"
                    className="text-slate-400 hover:text-white"
                    iconClassName="w-5 h-5"
                    size="sm"
                    onClick={onSave}
                  />
                </div>
              )}

              <div className="flex flex-1 flex-col">
                <FlipBoardIconButton
                  onClick={onFlipBoard}
                  tooltipPositon="right"
                />
                <StartPositionIconButton
                  tooltipPositon="right"
                  onClick={() => {
                    onUpdateFen(ChessFENBoard.STARTING_FEN);

                    resetArrowsAndCircles();
                  }}
                />
                <ClearBoardIconButton
                  tooltipPositon="right"
                  onClick={() => {
                    onUpdateFen(ChessFENBoard.ONLY_KINGS_FEN);

                    resetArrowsAndCircles();
                  }}
                />
              </div>
            </div>

            <div className="flex-1" />
          </div>
        </div>
        <div className="flex flsex-col flex-1s rounded-lg overflow-hidden bg-slate-600">
          {extraPiecesLayout.bottom}
        </div>
      </DndProvider>
    </div>
  );
};
