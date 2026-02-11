import { getNewChessGame, isValidPgn } from '@/lib/ChessRouler';
import { Chapter, ChapterState, LearnActivityState } from './types';
import { initialChapterState, initialDefaultChapter } from './state';
import {
  ActivityActions,
  ActivityState,
  initialActivityState,
} from '../../movex';
import { MovexReducer } from 'movex-core-util';
import { ChessFENBoard } from '@/lib/ChessFENBoard';
import { FreeBoardHistory } from '@/lib/FreeBoardHistory';

export const findLoadedChapter = (
  activityState: LearnActivityState['activityState'],
): Chapter | undefined =>
  activityState.chaptersMap[activityState.loadedChapterId];

export const reducer: MovexReducer<ActivityState, ActivityActions> = (
  prev: ActivityState = initialActivityState,
  action: ActivityActions,
): ActivityState => {
  if (prev.activityType !== 'learn') {
    return prev;
  }

  // TODO: Should this be split?
  if (action.type === 'loadedChapter:addMove') {
    // TODO: the logic for this should be in GameHistory class/static  so it can be tested
    try {
      const prevChapter = findLoadedChapter(prev.activityState);

      if (!prevChapter) {
        console.error('The loaded chapter was not found');
        return prev;
      }

      const move = action.payload;

      const fenBoard = new ChessFENBoard(prevChapter.displayFen);
      const fenPiece = fenBoard.piece(move.from);
      if (!fenPiece) {
        console.error('Action Err', action, prev, fenBoard.board);
        throw new Error(`No Piece at ${move.from}`);
      }

      const nextMove = fenBoard.move(move);

      // If the moves are the same introduce a non move
      const [nextHistory, addedAtIndex] = FreeBoardHistory.addMagicMove(
        {
          history: prevChapter.notation.history,
          atIndex: prevChapter.notation.focusedIndex,
        },
        nextMove,
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
        activityState: {
          ...prev.activityState,
          chaptersMap: {
            ...prev.activityState.chaptersMap,
            [prevChapter.id]: nextChapter,
          },
        },
      };
    } catch (e) {
      console.error('Action Error', action, prev, e);
      return prev;
    }
  }
  if (action.type === 'loadedChapter:import') {
    const prevChapter = findLoadedChapter(prev.activityState);

    if (!prevChapter) {
      console.error('The chapter wasnt found');
      return prev;
    }

    if (action.payload.input.type === 'FEN') {
      if (!ChessFENBoard.validateFenString(action.payload.input.val).ok) {
        console.log('not valid fen');
        return prev;
      }

      const nextFen = action.payload.input.val;
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
        activityState: {
          ...prev.activityState,
          chaptersMap: {
            ...prev.activityState.chaptersMap,
            [prevChapter.id]: {
              ...prev.activityState.chaptersMap[prevChapter.id],
              ...nextChapterState,
            },
          },
        },
      };
    }

    if (action.payload.input.type === 'PGN') {
      if (!isValidPgn(action.payload.input.val)) {
        console.log('not valid pgn');
        return prev;
      }

      const chessGame = getNewChessGame({
        pgn: action.payload.input.val,
      });
      const nextHistory = FreeBoardHistory.pgnToHistory(
        action.payload.input.val,
      );

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
        activityState: {
          ...prev.activityState,
          chaptersMap: {
            ...prev.activityState.chaptersMap,
            [prevChapter.id]: {
              ...prev.activityState.chaptersMap[prevChapter.id],
              ...nextChapterState,
            },
          },
        },
      };
    }
  }

  if (action.type === 'loadedChapter:focusHistoryIndex') {
    const prevChapter = findLoadedChapter(prev.activityState);

    if (!prevChapter) {
      console.error('The chapter wasnt found');
      return prev;
    }

    const historyAtFocusedIndex =
      FreeBoardHistory.calculateLinearHistoryToIndex(
        prevChapter.notation.history,
        action.payload,
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
      activityState: {
        ...prev.activityState,
        chaptersMap: {
          ...prev.activityState.chaptersMap,
          [prevChapter.id]: {
            ...prev.activityState.chaptersMap[prevChapter.id],
            ...nextChapterState,
          },
        },
      },
    };
  }

  if (action.type === 'loadedChapter:deleteHistoryMove') {
    const prevChapter = findLoadedChapter(prev.activityState);

    if (!prevChapter) {
      console.error('No loaded chapter');
      return prev;
    }

    const [slicedHistory, lastIndexInSlicedHistory] =
      FreeBoardHistory.sliceHistory(
        prevChapter.notation.history,
        action.payload,
      );
    const nextHistory = FreeBoardHistory.removeTrailingNonMoves(slicedHistory);
    const nextIndex = FreeBoardHistory.findNextValidMoveIndex(
      nextHistory,
      FreeBoardHistory.incrementIndex(lastIndexInSlicedHistory),
      'left',
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
      activityState: {
        ...prev.activityState,
        chaptersMap: {
          ...prev.activityState.chaptersMap,
          [nextChapter.id]: nextChapter,
        },
      },
    };
  }
  if (action.type === 'loadedChapter:setOrientation') {
    const prevChapter = findLoadedChapter(prev.activityState);

    if (!prevChapter) {
      console.error('No loaded chapter');
      return prev;
    }

    const nextChapter: Chapter = {
      ...prevChapter,
      orientation: action.payload.color,
    };

    return {
      ...prev,
      activityState: {
        ...prev.activityState,
        chaptersMap: {
          ...prev.activityState.chaptersMap,
          [nextChapter.id]: nextChapter,
        },
      },
    };
  }
  if (action.type === 'loadedChapter:setArrows') {
    const prevChapter = findLoadedChapter(prev.activityState);

    if (!prevChapter) {
      console.error('No loaded chapter');
      return prev;
    }

    const nextChapter: Chapter = {
      ...prevChapter,
      arrowsMap: action.payload,
    };

    return {
      ...prev,
      activityState: {
        ...prev.activityState,
        chaptersMap: {
          ...prev.activityState.chaptersMap,
          [nextChapter.id]: nextChapter,
        },
      },
    };
  }
  if (action.type === 'loadedChapter:drawCircle') {
    const prevChapter = findLoadedChapter(prev.activityState);

    if (!prevChapter) {
      console.error('No loaded chapter');
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
      activityState: {
        ...prev.activityState,
        chaptersMap: {
          ...prev.activityState.chaptersMap,
          [nextChapter.id]: nextChapter,
        },
      },
    };
  }
  if (action.type === 'loadedChapter:clearCircles') {
    const prevChapter = findLoadedChapter(prev.activityState);

    if (!prevChapter) {
      console.error('No loaded chapter');
      return prev;
    }

    const nextChapter: Chapter = {
      ...prevChapter,
      circlesMap: {},
    };

    return {
      ...prev,
      activityState: {
        ...prev.activityState,
        chaptersMap: {
          ...prev.activityState.chaptersMap,
          [nextChapter.id]: nextChapter,
        },
      },
    };
  }
  if (action.type === 'loadedChapter:updateFen') {
    const prevChapter = findLoadedChapter(prev.activityState);

    if (!prevChapter) {
      console.error('No loaded chapter');
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
      activityState: {
        ...prev.activityState,
        chaptersMap: {
          ...prev.activityState.chaptersMap,
          [nextChapter.id]: nextChapter,
        },
      },
    };
  }

  if (action.type === 'createChapter') {
    const nextChapterIndex = prev.activityState.chaptersIndex + 1;
    const nextChapterId = String(nextChapterIndex);

    return {
      ...prev,
      activityState: {
        ...prev.activityState,
        chaptersMap: {
          ...prev.activityState.chaptersMap,
          [nextChapterId]: {
            id: nextChapterId,
            ...action.payload,
          },
        },
        loadedChapterId: nextChapterId,
        chaptersIndex: nextChapterIndex,
      },
    };
  }
  if (action.type === 'updateChapter') {
    const { [action.payload.id]: prevChapter } = prev.activityState.chaptersMap;

    const nextChapter: Chapter = {
      ...prevChapter,
      ...action.payload.state,

      // Ensure the notation resets each time there is an update (the starting fen might change)
      notation: action.payload.state.notation || initialChapterState.notation,
    };

    return {
      ...prev,
      activityState: {
        ...prev.activityState,
        chaptersMap: {
          ...prev.activityState.chaptersMap,
          [nextChapter.id]: nextChapter,
        },
        loadedChapterId: nextChapter.id,
      },
    };
  }
  if (action.type === 'deleteChapter') {
    // Remove the current one
    const { [action.payload.id]: removed, ...restChapters } =
      prev.activityState.chaptersMap;

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
      activityState: {
        ...prev.activityState,
        chaptersMap: nextChapters,
      },
    };
  }

  if (action.type === 'loadChapter') {
    const { [action.payload.id]: chapter } = prev.activityState.chaptersMap;
    if (!chapter) {
      return prev;
    }

    return {
      ...prev,
      activityState: {
        ...prev.activityState,
        loadedChapterId: chapter.id,
      },
    };
  }

  return prev;
};
