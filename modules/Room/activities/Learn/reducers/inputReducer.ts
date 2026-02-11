import { Action } from 'movex-core-util';
import { Chapter, ChapterState } from '../movex';
import { ImportedInput } from '@/components/PgnInputBox/PgnInputBox';
import { CircleDrawTuple } from '@/components/Chessboard/types';
import { ChessFEN, ChessMove, getNewChessGame, isValidPgn } from '@/lib/ChessRouler';
import { ChessFENBoard } from '@/lib/ChessFENBoard';
import { FreeBoardHistory } from '@/lib/FreeBoardHistory';

export type InputState =
  | {
      // this means the instructor creates or edits chapters atm
      isActive: true;
      isBoardEditorShown: boolean;
      chapterState: ChapterState | Chapter; // Create or Update Chapter but it will come here!
    }
  | {
      isActive: false;
      isBoardEditorShown?: false;
      chapterState: undefined;
    };

export type AcvtiveInputState = Extract<InputState, { isActive: true }>;

export type InputAction =
  | Action<
      'activate',
      {
        isBoardEditorShown?: boolean;
        chapterState: ChapterState; // Create or Update Chapter but it will come here!
      }
    >
  | Action<'deactivate'>
  | Action<'move', { move: ChessMove }>
  | Action<'updateChapterFen', { fen: ChessFEN }>
  | Action<'updatePartialChapter', Partial<Omit<ChapterState, 'notation'>>>
  | Action<'drawCircle', CircleDrawTuple>
  | Action<'clearCircles'>
  | Action<'import', ImportedInput>

  // TODO This maybe is too generericzx
  | Action<
      'update',
      Partial<{
        chapterState: ChapterState;
        isBoardEditorShown?: boolean;
      }>
    >;

export const initialInputState: InputState = {
  isActive: false,
  chapterState: undefined,
  isBoardEditorShown: false,
};

export default (
  prev: InputState = initialInputState,
  action: InputAction
): InputState => {
  if (action.type === 'activate') {
    return {
      isActive: true,
      isBoardEditorShown: !!action.payload.isBoardEditorShown,
      chapterState: action.payload.chapterState,
    };
  }

  if (action.type === 'deactivate') {
    return {
      isActive: false,
      chapterState: undefined,
    };
  }

  if (action.type === 'move') {
    if (!prev.isActive) {
      return prev;
    }

    const { move } = action.payload;

    const fenBoard = new ChessFENBoard(prev.chapterState.displayFen);
    const fenPiece = fenBoard.piece(move.from);
    if (!fenPiece) {
      console.error('Err', fenBoard.board);
      throw new Error(`No Piece at ${move.from}`);
    }

    fenBoard.move(move);

    const nextFen = fenBoard.fen;

    const nextChapterState: ChapterState = {
      ...prev.chapterState,
      displayFen: nextFen,
      notation: {
        ...prev.chapterState.notation,
        startingFen: nextFen,
      },
    };

    return {
      ...prev,
      chapterState: nextChapterState,
    };
  }

  if (action.type === 'updateChapterFen') {
    if (!prev.isActive) {
      return prev;
    }

    const nextFen = action.payload.fen;

    const nextChapterState: ChapterState = {
      ...prev.chapterState,
      displayFen: nextFen,
      notation: {
        ...prev.chapterState.notation,
        startingFen: nextFen,
      },
    };

    return {
      ...prev,
      chapterState: nextChapterState,
    };
  }

  if (action.type === 'updatePartialChapter') {
    if (!prev.isActive) {
      return prev;
    }

    const nextChapterState: ChapterState = {
      ...prev.chapterState,
      ...action.payload,
    };

    return {
      ...prev,
      chapterState: nextChapterState,
    };
  }

  if (action.type === 'drawCircle') {
    if (!prev.isActive) {
      return prev;
    }

    const [at, hex] = action.payload;
    const circleId = `${at}`;
    const { [circleId]: existent, ...restOfCirlesMap } =
      prev.chapterState.circlesMap;

    const nextChapterState: ChapterState = {
      ...prev.chapterState,
      circlesMap: {
        ...restOfCirlesMap,
        ...(!!existent
          ? undefined // Set it to undefined if same
          : { [circleId]: action.payload }),
      },
    };

    return {
      ...prev,
      chapterState: nextChapterState,
    };
  }
  if (action.type === 'clearCircles') {
    if (!prev.isActive) {
      return prev;
    }

    const nextChapterState: ChapterState = {
      ...prev.chapterState,
      circlesMap: {},
    };

    return {
      ...prev,
      chapterState: nextChapterState,
    };
  }

  if (action.type === 'update') {
    // TODO: Maybe this is too generic but it's ok for now
    if (!prev.isActive) {
      return prev;
    }

    return {
      ...prev,
      ...action.payload,
    };
  }

  if (action.type === 'import') {
    if (!prev.isActive) {
      return prev;
    }

    if (action.payload.type === 'FEN') {
      if (!ChessFENBoard.validateFenString(action.payload.val).ok) {
        return prev;
      }

      const nextFen = action.payload.val;

      const nextChapterState: ChapterState = {
        ...prev.chapterState,
        displayFen: nextFen,

        // When importing PGNs set the notation from this fen
        notation: {
          startingFen: nextFen,
          history: [],
          focusedIndex: FreeBoardHistory.getStartingIndex(),
        },
      };

      return {
        ...prev,
        chapterState: nextChapterState,
      };
    }

    if (action.payload.type === 'PGN') {
      if (!isValidPgn(action.payload.val)) {
        return prev;
      }

      const instance = getNewChessGame({
        pgn: action.payload.val,
      });
      const nextHistory = FreeBoardHistory.pgnToHistory(action.payload.val);

      const nextChapterState: ChapterState = {
        ...prev.chapterState,
        displayFen: instance.fen(),

        // When importing PGNs set the notation history as well
        notation: {
          startingFen: ChessFENBoard.STARTING_FEN,
          history: nextHistory,
          focusedIndex: FreeBoardHistory.getLastIndexInHistory(nextHistory),
        },
      };

      return {
        ...prev,
        chapterState: nextChapterState,
      };
    }

    return prev;
  }

  return prev;
};
