import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChessFEN,
  ChessFENBoard,
  PieceSan,
  getSquareSize,
  isBlackColor,
  objectKeys,
  pieceSanToFenBoardPieceSymbol,
  toShortColor,
} from '@xmatter/util-kit';
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
  onUpdated: (fen: ChessFEN) => void;
  onFlipBoard: () => void;
  onCancel: () => void;
  onSave: () => void;
  sizePx: number;
};

const whitePieces: PieceSan[] = ['wP', 'wB', 'wN', 'wQ', 'wR'];
const blackPieces: PieceSan[] = ['bP', 'bB', 'bN', 'bQ', 'bR'];

export const BoardEditor = ({
  fen = ChessFENBoard.STARTING_FEN,
  sizePx,
  onUpdated,
  onFlipBoard,
  onCancel,
  onSave,
  ...props
}: BoardEditorProps) => {
  const [initialFen] = useState(fen);

  const fenBoard = useInstance<ChessFENBoard>(new ChessFENBoard(fen));
  // const [editedFen, setEditedFen] = useState(fenBoard.fen);
  const [draggingPieces, setDraggingPieces] = useState<
    Partial<Record<PieceSan, boolean>>
  >({});

  const isDragging = useMemo(
    () => objectKeys(draggingPieces).length > 0,
    [draggingPieces]
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
    [draggingPieces]
  );

  const onPieceDraggingStopped = useCallback(
    (pieceSan: PieceSan) => {
      if (draggingPieces[pieceSan]) {
        const { [pieceSan]: _removed, ...prevWithoutRemoved } = draggingPieces;

        setDraggingPieces(prevWithoutRemoved);
      }
    },
    [draggingPieces]
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
    ]
  );

  const [draggedPiece, setDraggedPiece] = useState<{
    piece: PieceSan;
    from: Square;
    dropped: boolean;
  }>();

  const extraPiecesLayout = useMemo(() => {
    if (toShortColor(props.boardOrientation || 'w') === 'w') {
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
      className="flex flex-col sjustify-between items-center justify-center gap-2 sbg-slate-700 rounded-xl bsg-red-100"
      style={{ height: sizePx }}
    >
      <DndProvider backend={HTML5Backend}>
        <div className="flex flex-scol flex-1s rounded-lg overflow-hidden bg-slate-600">
          {extraPiecesLayout.top}
        </div>
        <div
          className="flex flex-cosl sjustify-between justify-center"
          style={{
            width: sizePx,
            // height: sizePx,
          }}
        >
          <DropContainer
            isActive={isDragging}
            onHover={(_, square) => {
              setHoveredSquare(square);
            }}
            onDrop={(pieceSan, square) => {
              fenBoard.put(square, pieceSanToFenBoardPieceSymbol(pieceSan));

              // setEditedFen(fenBoard.fen);
              onUpdated(fenBoard.fen);
              setHoveredSquare(undefined);
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
              onMove={(p) => {
                fenBoard.move(p.from, p.to);

                onUpdated(fenBoard.fen);

                setHoveredSquare(undefined);

                // props.onArrowsChange()

                return true;
              }}
              onPieceDragBegin={(piece, from) => {
                setDraggedPiece({ piece, dropped: false, from });
              }}
              onPieceDrop={(from, to, piece) => {
                setDraggedPiece({ piece, dropped: true, from });
                return true;
              }}
              onPieceDragEnd={(piece, from) => {
                setDraggedPiece((prev) => {
                  if (prev) {
                    const {
                      piece: draggedPiece,
                      dropped,
                      from: prevFrom,
                    } = prev;

                    // If the draggedPiece haven't dropped yet, it means it got dragged outside
                    if (
                      draggedPiece === piece &&
                      // prevFrom !== from &&
                      dropped === false
                    ) {
                      fenBoard.clear(from);

                      onUpdated(fenBoard.fen);
                    }
                  }

                  return undefined;
                });
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
              <div>
                <ConfirmButton
                  iconButton
                  icon="XCircleIcon"
                  // iconKind="outline"
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
                    onUpdated(initialFen);
                    // and then cancel
                    onCancel();
                  }}
                />
                <IconButton
                  icon="CheckCircleIcon"
                  // iconKind="outline"
                  type="custom"
                  tooltip="Use Position"
                  tooltipPositon="right"
                  className="text-slate-400 hover:text-white"
                  iconClassName="w-5 h-5"
                  // iconColor=''
                  size="sm"
                  onClick={onSave}
                />
              </div>
              {/* <div className="flex items-center justify-center">
                <div className='flex.5 border-b border-slate-600' />
              </div> */}
              <div className="flex flex-1 flex-col">
                <FlipBoardIconButton
                  onClick={onFlipBoard}
                  tooltipPositon="right"
                />
                <StartPositionIconButton
                  tooltipPositon="right"
                  onClick={() => {
                    onUpdated(ChessFENBoard.STARTING_FEN);

                    resetArrowsAndCircles();
                  }}
                />
                <ClearBoardIconButton
                  tooltipPositon="right"
                  onClick={() => {
                    onUpdated(ChessFENBoard.ONLY_KINGS_FEN);

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