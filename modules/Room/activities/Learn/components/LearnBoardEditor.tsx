import {
  BoardEditor,
  BoardEditorProps,
} from '@/components/BoardEditor';
import { ChapterBoardState } from '../movex';

export type LearnBoardEditorProps = {
  boardSizePx: number;
  state: ChapterBoardState;
  boardOrientation?: BoardEditorProps['boardOrientation'];
} & Required<
  Pick<
    BoardEditorProps,
    | 'onUpdateFen'
    | 'onClearCircles'
    | 'onFlipBoard'
    | 'onCircleDraw'
    | 'onArrowsChange'
    | 'showSaveButtons'
    | 'onCancel'
    | 'onSave'
  >
>;

// @deprecate a not used anymore in favor of InstructorBoard direct usage
export const LearnBoardEditor = ({
  state: { displayFen, orientation, arrowsMap, circlesMap },
  boardOrientation,
  boardSizePx,
  ...boardProps
}: LearnBoardEditorProps) => (
  <BoardEditor
    fen={displayFen}
    sizePx={boardSizePx}
    boardOrientation={boardOrientation || orientation}
    arrowsMap={arrowsMap}
    circlesMap={circlesMap}
    {...boardProps}
  />
);
