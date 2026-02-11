import {
  getNewChessGame,
  isValidPgn,
} from '@/lib/ChessRouler';
import { Actions, Chapter, ChapterState, LessonState } from './types';
import {
  initialChapterState,
  initialDefaultChapter,
  initialLessonState,
} from './state';
import { ChessFENBoard } from '@/lib/ChessFENBoard';
import { FreeBoardHistory } from '@/lib/FreeBoardHistory';

export const findLoadedChapter = (lesson: LessonState): Chapter | undefined =>
  lesson.chaptersMap[lesson.loadedChapterId];

//TODO: Remove the console.error in favor of sentry
export const reducer = (
  prev: LessonState = initialLessonState,
  action: Actions
): LessonState => {
  // TODO: Should this be split?
  if (action.type === 'loadedChapter:addMove') {
    // TODO: the logic for this should be in GameHistory class/static  so it can be tested
    try {
      const prevChapter = findLoadedChapter(prev);

      if (!prevChapter) {
        console.error('The loaded chapter was not found', action, prev);
        return prev;
      }

      const move = action.payload;

      const fenBoard = new ChessFENBoard(prevChapter.displayFen);
      const fenPiece = fenBoard.piece(move.from);
      if (!fenPiece) {
        console.error('No Fen Piece', action, prev, fenBoard.board);
        throw new Error(`No Piece at ${move.from}`);
      }

      const nextMove = fenBoard.move(move);

      // If the moves are the same introduce a non move
      const [nextHistory, addedAtIndex] = FreeBoardHistory.addMagicMove(
        {
          history: prevChapter.notation.history,
          atIndex: prevChapter.notation.focusedIndex,
        },
        nextMove
      );

      const nextChapter: Chapter = {
        ...prevChapter,
        displayFen: fenBoard.fen,
        circlesMap: {},
        arrowsMap: {},
        notation: {
          ...prevChapter.notation,
          history: nextHistory,
          focusedIndex: addedAtIndex,
        },
      };

      return {
        ...prev,
        chaptersMap: {
          ...prev.chaptersMap,
          [prevChapter.id]: nextChapter,
        },
      };
    } catch (e) {
      console.error('Action Error', action, prev, e);
      return prev;
    }
  }
  if (action.type === 'loadedChapter:import') {
    const prevChapter = findLoadedChapter(prev);

    if (!prevChapter) {
      console.error('The chapter was NOT found', action, prev);
      return prev;
    }

    if (action.payload.type === 'FEN') {
      if (!ChessFENBoard.validateFenString(action.payload.val).ok) {
        console.error('The FEN is NOT valid', action, prev);
        return prev;
      }

      const nextFen = action.payload.val;
      const nextChapterState: ChapterState = {
        ...prevChapter,
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
        chaptersMap: {
          ...prev.chaptersMap,
          [prevChapter.id]: {
            ...prev.chaptersMap[prevChapter.id],
            ...nextChapterState,
          },
        },
      };
    }

    if (action.payload.type === 'PGN') {
      if (!isValidPgn(action.payload.val)) {
        console.error('Not valid pgn', action, prev);
        return prev;
      }

      const chessGame = getNewChessGame({
        pgn: action.payload.val,
      });
      const nextHistory = FreeBoardHistory.pgnToHistory(action.payload.val);

      const nextChapterState: ChapterState = {
        ...prevChapter,
        displayFen: chessGame.fen(),

        // When importing PGNs set the notation history as well
        notation: {
          startingFen: ChessFENBoard.STARTING_FEN,
          history: nextHistory,
          focusedIndex: FreeBoardHistory.getLastIndexInHistory(nextHistory),
        },
      };

      return {
        ...prev,
        chaptersMap: {
          ...prev.chaptersMap,
          [prevChapter.id]: {
            ...prev.chaptersMap[prevChapter.id],
            ...nextChapterState,
          },
        },
      };
    }
  }

  if (action.type === 'loadedChapter:focusHistoryIndex') {
    const prevChapter = findLoadedChapter(prev);

    if (!prevChapter) {
      console.error('The chapter was NOT found', action, prev);
      return prev;
    }

    const historyAtFocusedIndex =
      FreeBoardHistory.calculateLinearHistoryToIndex(
        prevChapter.notation.history,
        action.payload
      );

    // TODO: Here this can be abstracted
    const fenBoard = new ChessFENBoard(prevChapter.notation.startingFen);
    historyAtFocusedIndex.forEach((m) => {
      if (!m.isNonMove) {
        fenBoard.move(m);
      }
    });

    const nextChapterState: ChapterState = {
      ...prevChapter,
      displayFen: fenBoard.fen,
      notation: {
        ...prevChapter.notation,
        focusedIndex: action.payload,
      },
    };

    return {
      ...prev,
      chaptersMap: {
        ...prev.chaptersMap,
        [prevChapter.id]: {
          ...prev.chaptersMap[prevChapter.id],
          ...nextChapterState,
        },
      },
    };
  }

  if (action.type === 'loadedChapter:deleteHistoryMove') {
    const prevChapter = findLoadedChapter(prev);

    if (!prevChapter) {
      console.error('No loaded chapter', action, prev);
      return prev;
    }

    const [slicedHistory, lastIndexInSlicedHistory] =
      FreeBoardHistory.sliceHistory(
        prevChapter.notation.history,
        action.payload
      );
    const nextHistory = FreeBoardHistory.removeTrailingNonMoves(slicedHistory);
    const nextIndex = FreeBoardHistory.findNextValidMoveIndex(
      nextHistory,
      FreeBoardHistory.incrementIndex(lastIndexInSlicedHistory),
      'left'
    );

    // TODO: Here this can be abstracted
    const fenBoard = new ChessFENBoard(prevChapter.notation.startingFen);
    nextHistory.forEach((turn, i) => {
      turn.forEach((m) => {
        if (m.isNonMove) {
          return;
        }
        fenBoard.move(m);
      });
    });
    const nextFen = fenBoard.fen;

    const nextChapter: Chapter = {
      ...prevChapter,
      displayFen: nextFen,
      circlesMap: {},
      arrowsMap: {},
      notation: {
        ...prevChapter.notation,
        history: nextHistory,
        focusedIndex: nextIndex,
      },
    };

    return {
      ...prev,
      chaptersMap: {
        ...prev.chaptersMap,
        [nextChapter.id]: nextChapter,
      },
    };
  }
  if (action.type === 'loadedChapter:setOrientation') {
    const prevChapter = findLoadedChapter(prev);

    if (!prevChapter) {
      console.error('No loaded chapter', action, prev);
      return prev;
    }

    const nextChapter: Chapter = {
      ...prevChapter,
      orientation: action.payload.to,
    };

    return {
      ...prev,
      chaptersMap: {
        ...prev.chaptersMap,
        [nextChapter.id]: nextChapter,
      },
    };
  }
  if (action.type === 'loadedChapter:setArrows') {
    const prevChapter = findLoadedChapter(prev);

    if (!prevChapter) {
      console.error('No loaded chapter', action, prev);
      return prev;
    }

    const nextChapter: Chapter = {
      ...prevChapter,
      arrowsMap: action.payload,
    };

    return {
      ...prev,
      chaptersMap: {
        ...prev.chaptersMap,
        [nextChapter.id]: nextChapter,
      },
    };
  }
  if (action.type === 'loadedChapter:drawCircle') {
    const prevChapter = findLoadedChapter(prev);

    if (!prevChapter) {
      console.error('No loaded chapter', action, prev);
      return prev;
    }

    const [at, hex] = action.payload;
    const circleId = `${at}`;
    const { [circleId]: existent, ...restOfCirlesMap } = prevChapter.circlesMap;

    const nextChapter: Chapter = {
      ...prevChapter,
      circlesMap: {
        ...restOfCirlesMap,
        ...(!!existent
          ? undefined // Set it to undefined if same
          : { [circleId]: action.payload }),
      },
    };

    return {
      ...prev,
      chaptersMap: {
        ...prev.chaptersMap,
        [nextChapter.id]: nextChapter,
      },
    };
  }
  if (action.type === 'loadedChapter:clearCircles') {
    const prevChapter = findLoadedChapter(prev);

    if (!prevChapter) {
      console.error('No loaded chapter', action, prev);
      return prev;
    }

    const nextChapter: Chapter = {
      ...prevChapter,
      circlesMap: {},
    };

    return {
      ...prev,
      chaptersMap: {
        ...prev.chaptersMap,
        [nextChapter.id]: nextChapter,
      },
    };
  }
  if (action.type === 'loadedChapter:updateFen') {
    const prevChapter = findLoadedChapter(prev);

    if (!prevChapter) {
      console.error('No loaded chapter', action, prev);
      return prev;
    }

    const nextFen = action.payload;

    const nextChapter: Chapter = {
      ...prevChapter,
      displayFen: nextFen,
      arrowsMap: {},
      circlesMap: {},

      // Ensure the notation resets each time there is an update (the starting fen might change)
      notation: {
        ...initialChapterState.notation,

        // this needs to always start from the given fen, otherwise issues may arise
        startingFen: nextFen,
      },
    };

    return {
      ...prev,
      chaptersMap: {
        ...prev.chaptersMap,
        [nextChapter.id]: nextChapter,
      },
    };
  }

  if (action.type === 'createChapter') {
    const nextChapterIndex = prev.chaptersIndex + 1;
    const nextChapterId = String(nextChapterIndex);

    return {
      ...prev,
      chaptersMap: {
        ...prev.chaptersMap,
        [nextChapterId]: {
          ...action.payload,
          id: nextChapterId,
        },
      },
      loadedChapterId: nextChapterId,
      chaptersIndex: nextChapterIndex,
    };
  }
  if (action.type === 'updateChapter') {
    const { [action.payload.id]: prevChapter } = prev.chaptersMap;

    const nextChapter: Chapter = {
      ...prevChapter,
      ...action.payload.state,

      // Ensure the notation resets each time there is an update (the starting fen might change)
      notation: action.payload.state.notation || initialChapterState.notation,
    };

    return {
      ...prev,
      chaptersMap: {
        ...prev.chaptersMap,
        [nextChapter.id]: nextChapter,
      },
      loadedChapterId: nextChapter.id,
    };
  }
  if (action.type === 'deleteChapter') {
    // Remove the current one
    const { [action.payload.id]: removed, ...restChapters } = prev.chaptersMap;

    // and if it's the last one, add the initial one again
    // There always needs to be one chapter in
    const nextChapters =
      Object.keys(restChapters).length > 0
        ? restChapters
        : {
            [initialDefaultChapter.id]: initialDefaultChapter,
          };

    return {
      ...prev,
      chaptersMap: nextChapters,
      loadedChapterId: Object.values(nextChapters)[0].id || initialLessonState.loadedChapterId,
    };
  }

  // TODO: I believe this isn't needed anymore after the refactoring
  if (action.type === 'loadChapter') {
    const { [action.payload.id]: chapter } = prev.chaptersMap;
    if (!chapter) {
      return prev;
    }

    return {
      ...prev,
      loadedChapterId: chapter.id,
      
    };
  }

  return prev;
};
