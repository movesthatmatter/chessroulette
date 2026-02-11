import { Freeboard } from '@/components/Boards';
import { RIGHT_SIDE_SIZE_PX } from '../../../constants';
import { IconButton } from '@/components/Button';
import { PanelResizeHandle } from 'react-resizable-panels';
import { BoardEditor } from '@/components/BoardEditor';
import { ChessboardContainerProps } from '@/components/Chessboard';
import { ChessColor, ChessFEN } from '@/lib/ChessRouler';
import { noop } from '@/lib/misc';
import { ChessFENBoard } from '@/lib/ChessFENBoard';

type CommonBoardProps = Pick<
  ChessboardContainerProps,
  'onArrowsChange' | 'onCircleDraw' | 'onClearCircles' | 'onMove'
> & {
  onFlipBoard: () => void;
  onToggleBoardEditor?: () => void;
  showBoardEditorSaveButtons?: boolean;
};

type Props = {
  fen: ChessFEN;
  boardOrientation?: ChessColor;
  showBoardEditor?: boolean;
  boardSizePx: number;
} & CommonBoardProps & {
    onUpdateFen: (nextFen: ChessFEN) => void;
  };

export const InstructorBoard = ({
  boardSizePx,
  showBoardEditor = false,
  onToggleBoardEditor = noop,
  boardOrientation,
  ...chessBoardProps
}: Props) => {
  if (showBoardEditor) {
    return (
      <BoardEditor
        sizePx={boardSizePx}
        boardOrientation={boardOrientation}
        {...chessBoardProps}
        showSaveButtons={chessBoardProps.showBoardEditorSaveButtons}
        onCancel={onToggleBoardEditor}
        onSave={onToggleBoardEditor}
      />
    );
  }

  return (
    <Freeboard
      sizePx={boardSizePx}
      {...chessBoardProps}
      rightSideSizePx={RIGHT_SIDE_SIZE_PX}
      rightSideClassName="flex flex-col"
      rightSideComponent={
        <>
          <div className="flex-1">
            <IconButton
              icon="ArrowsUpDownIcon"
              iconKind="outline"
              type="clear"
              size="sm"
              tooltip="Flip Board"
              tooltipPositon="left"
              className="mb-2"
              onClick={chessBoardProps.onFlipBoard}
            />
            <IconButton
              icon="TrashIcon"
              iconKind="outline"
              type="clear"
              size="sm"
              tooltip="Clear Board"
              tooltipPositon="left"
              className="mb-2"
              onClick={() => {
                chessBoardProps.onUpdateFen(ChessFENBoard.ONLY_KINGS_FEN);
              }}
            />
            <IconButton
              icon="ArrowPathIcon"
              iconKind="outline"
              type="clear"
              size="sm"
              tooltip="Start Position"
              tooltipPositon="left"
              className="mb-2"
              onClick={() => {
                chessBoardProps.onUpdateFen(ChessFENBoard.STARTING_FEN);
              }}
            />

            <IconButton
              icon="PencilSquareIcon"
              iconKind="outline"
              type="clear"
              size="sm"
              tooltip="Board Editor"
              tooltipPositon="left"
              className="mb-2"
              onClick={onToggleBoardEditor}
            />
          </div>

          <div className="relative flex flex-col items-center justify-center">
            <PanelResizeHandle
              className="w-1 h-20 rounded-lg bg-slate-600"
              title="Resize"
            />
          </div>
          <div className="flex-1" />
        </>
      }
    />
  );
};
