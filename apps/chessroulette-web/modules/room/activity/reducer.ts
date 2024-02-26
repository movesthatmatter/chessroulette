import {
  ChessArrowId,
  ChessColor,
  ChessFEN,
  ChessFENBoard,
  ChessMove,
  ChessPGN,
  ChesscircleId,
  DistributiveOmit,
  FBHHistory,
  FBHIndex,
  FBHMove,
  FenBoardPromotionalPieceSymbol,
  FreeBoardHistory,
  getNewChessGame,
  invoke,
  isValidPgn,
  pieceSanToFenBoardPieceSymbol,
  swapColor,
} from '@xmatter/util-kit';
import { Square } from 'chess.js';
import { Action, objectKeys } from 'movex-core-util';

export type ArrowDrawTuple = [from: Square, to: Square, hex?: string];
export type ArrowsMap = Record<ChessArrowId, ArrowDrawTuple>;

export type CircleDrawTuple = [at: Square, hex: string];
export type CirclesMap = Record<ChesscircleId, CircleDrawTuple>;

export type SquareMap = Record<Square, undefined>;

export type LearnActivityState = {
  activityType: 'learn';
  activityState: {
    // fen: ChessFEN;
    // boardOrientation: ChessColor;
    // arrows: ArrowsMap;
    // circles: CirclesMap;
    // history: {
    //   startingFen: ChessFEN;
    //   moves: FBHHistory;
    //   focusedIndex: FBHIndex;
    // };
    loadedChapterId: Chapter['id'];
    chaptersMap: Record<Chapter['id'], Chapter>;
    chaptersIndex: number;

    // This is only here when there is no chapter created - kinda like
    // student and instructor just play around
    // freeChapter: ChapterState;
  };
};

export type OtherActivities = {
  activityType: 'play' | 'meetup' | 'none';
  activityState: {};
};

export type ActivityState = LearnActivityState | OtherActivities;

export const initialActivtityState: ActivityState = {
  activityType: 'none',
  activityState: {},
};

export type Chapter = {
  id: string;
  // createdAt: number;
} & ChapterState;

export type ChapterState = {
  name: string;

  // Also the chapter might get a type: position, or puzzle (containing next correct moves)

  notation: {
    // The starting fen is the chapter fen
    history: FBHHistory;
    focusedIndex: FBHIndex;
    startingFen: ChessFEN; // This could be strtingPGN as well especially for puzzles but not necessarily
  };
} & ChapterBoardState;

export type ChapterBoardState = {
  // Board State
  displayFen: ChessFEN; // This could be strtingPGN as well especially for puzzles but not necessarily

  // fen: ChessFEN;
  arrowsMap: ArrowsMap;
  circlesMap: CirclesMap;

  // TODO: This make required once refactored
  orientation: ChessColor;
};

export const initialChapterState: ChapterState = {
  name: 'New Chapter', // TODO: Should it have a name?
  displayFen: ChessFENBoard.STARTING_FEN,
  arrowsMap: {},
  circlesMap: {},
  notation: {
    history: [],
    focusedIndex: FreeBoardHistory.getStartingIndex(),
    startingFen: ChessFENBoard.STARTING_FEN,
  },
  orientation: 'w',
};

// export const initialFreeChapter = { ...initialChapterState, name: '' };

export const initialDefaultChapter: Chapter = {
  ...initialChapterState,
  name: 'Chapter 1',
  id: '0',
};

export const initialLearnActivityState: LearnActivityState = {
  activityType: 'learn',
  activityState: {
    chaptersMap: {
      [initialDefaultChapter.id]: initialDefaultChapter,
    },
    loadedChapterId: initialDefaultChapter.id,
    chaptersIndex: 1,
    // freeChapter: initialFreeChapter,
  },
};

// PART 2: Action Types

export type ActivityActions =
  // Chapter Logistcs
  | Action<'createChapter', ChapterState>
  | Action<
      'updateChapter',
      {
        id: Chapter['id'];
        state: Partial<DistributiveOmit<ChapterState, 'notation'>>; // The notation is updateable via addMove or history actions only
      }
    >
  | Action<'deleteChapter', { id: Chapter['id'] }>
  | Action<'loadChapter', { id: Chapter['id'] }>
  | Action<'loadedChapter:addMove', ChessMove>
  | Action<'loadedChapter:focusHistoryIndex', FBHIndex>
  | Action<'loadedChapter:deleteHistoryMove', FBHIndex>
  | Action<'loadedChapter:drawCircle', CircleDrawTuple>
  | Action<'loadedChapter:clearCircles'>
  | Action<'loadedChapter:setArrows', ArrowsMap>
  | Action<'loadedChapter:setOrientation', ChessColor>
  | Action<'loadedChapter:updateFen', ChessFEN>;

// Board
// Deprecate
// | Action<'changeBoardOrientation', ChessColor>
// | Action<'arrowChange', ArrowsMap>
// | Action<'drawCircle', CircleDrawTuple>
// | Action<'clearCircles'>;

// PART 3: The Reducer – This is where all the logic happens

export const findLoadedChapter = (
  activityState: LearnActivityState['activityState']
): Chapter | undefined =>
  activityState.chaptersMap[activityState.loadedChapterId];

export default (
  prev: ActivityState = initialActivtityState,
  action: ActivityActions
): ActivityState => {
  if (prev.activityType === 'learn') {
    // TODO: Should this be split?
    if (action.type === 'loadedChapter:addMove') {
      // TODO: the logic for this should be in GameHistory class/static  so it can be tested
      try {
        const prevChapter = findLoadedChapter(prev.activityState);

        if (!prevChapter) {
          console.error('The loaded chapter was not found');
          return prev;
        }

        const { from, to, promoteTo } = action.payload;

        const instance = new ChessFENBoard(prevChapter.displayFen);
        const fenPiece = instance.piece(from);
        if (!fenPiece) {
          console.error('Err', instance.board);
          throw new Error(`No Piece at ${from}`);
        }
        const promoteToFenBoardPiecesymbol:
          | FenBoardPromotionalPieceSymbol
          | undefined = promoteTo
          ? (pieceSanToFenBoardPieceSymbol(
              promoteTo
            ) as FenBoardPromotionalPieceSymbol)
          : undefined;
        const nextMove = instance.move(
          from,
          to,
          promoteToFenBoardPiecesymbol
        ) as FBHMove;
        const prevMove = FreeBoardHistory.findMoveAtIndex(
          prevChapter.notation.history,
          prevChapter.notation.focusedIndex
        );
        const { history: prevHistoryMoves, focusedIndex: prevFocusedIndex } =
          prevChapter.notation;
        // If the moves are the same introduce a non move
        const [nextHistory, addedAtIndex] = invoke(() => {
          const isFocusedIndexLastInBranch =
            FreeBoardHistory.isLastIndexInHistoryBranch(
              prevHistoryMoves,
              prevFocusedIndex
            );
          const [_, __, prevFocusRecursiveIndexes] = prevFocusedIndex;
          if (prevFocusRecursiveIndexes) {
            const addAtIndex =
              FreeBoardHistory.incrementIndex(prevFocusedIndex);
            if (prevMove?.color === nextMove.color) {
              const [nextHistory, addedAtIndex] = FreeBoardHistory.addMove(
                prevChapter.notation.history,
                FreeBoardHistory.getNonMove(swapColor(nextMove.color)),
                addAtIndex
              );
              return FreeBoardHistory.addMove(
                nextHistory,
                nextMove,
                FreeBoardHistory.incrementIndex(addedAtIndex)
              );
            }
            return FreeBoardHistory.addMove(
              prevChapter.notation.history,
              nextMove,
              addAtIndex
            );
          }
          const addAtIndex = isFocusedIndexLastInBranch
            ? FreeBoardHistory.incrementIndex(prevChapter.notation.focusedIndex)
            : prevChapter.notation.focusedIndex;
          // if 1st move is black add a non move
          if (prevHistoryMoves.length === 0 && nextMove.color === 'b') {
            const [nextHistory] = FreeBoardHistory.addMove(
              prevChapter.notation.history,
              FreeBoardHistory.getNonMove(swapColor(nextMove.color))
            );
            return FreeBoardHistory.addMove(nextHistory, nextMove);
          }
          // If it's not the last branch
          if (!isFocusedIndexLastInBranch) {
            return FreeBoardHistory.addMove(
              prevChapter.notation.history,
              nextMove,
              prevFocusedIndex
            );
          }
          // Add nonMoves for skipping one
          if (prevMove?.color === nextMove.color) {
            const [nextHistory] = FreeBoardHistory.addMove(
              prevChapter.notation.history,
              FreeBoardHistory.getNonMove(swapColor(nextMove.color)),
              addAtIndex
            );
            return FreeBoardHistory.addMove(nextHistory, nextMove);
          }
          return FreeBoardHistory.addMove(
            prevChapter.notation.history,
            nextMove
          );
        });

        const nextChapterState: ChapterState = {
          ...prevChapter,
          displayFen: instance.fen,
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
              [prevChapter.id]: {
                ...prev.activityState.chaptersMap[prevChapter.id],
                ...nextChapterState,
              },
            },
          },
        };
      } catch (e) {
        console.error('failed', e);
        return prev;
      }
    }
    // // TODO: Bring all of these back
    // else if (action.type === 'importFen') {
    //   if (!ChessFENBoard.validateFenString(action.payload).ok) {
    //     return prev;
    //   }
    //   const nextMoves: FBHHistory = [];
    //   return {
    //     ...prev,
    //     activityState: {
    //       ...prev.activityState,
    //       fen: action.payload,
    //       circles: {},
    //       arrows: {},
    //       history: {
    //         startingFen: ChessFENBoard.STARTING_FEN,
    //         moves: nextMoves,
    //         focusedIndex: FreeBoardHistory.getLastIndexInHistory(nextMoves),
    //       },
    //     },
    //   };
    // } else if (action.type === 'importPgn') {
    //   if (!isValidPgn(action.payload)) {
    //     return prev;
    //   }
    //   const instance = getNewChessGame({
    //     pgn: action.payload,
    //   });
    //   const nextHistoryMovex = FreeBoardHistory.pgnToHistory(action.payload);
    //   return {
    //     ...prev,
    //     activityState: {
    //       ...prev.activityState,
    //       fen: instance.fen(),
    //       circles: {},
    //       arrows: {},
    //       history: {
    //         startingFen: ChessFENBoard.STARTING_FEN,
    //         moves: nextHistoryMovex,
    //         focusedIndex:
    //           FreeBoardHistory.getLastIndexInHistory(nextHistoryMovex),
    //       },
    //     },
    //   };
    // }
    else if (action.type === 'loadedChapter:focusHistoryIndex') {
      const prevChapter = findLoadedChapter(prev.activityState);

      if (!prevChapter) {
        console.error('The chapter wasnt found');
        return prev;
      }

      const historyAtFocusedIndex =
        FreeBoardHistory.calculateLinearHistoryToIndex(
          prevChapter.notation.history,
          action.payload
        );
      const instance = new ChessFENBoard(prevChapter.notation.startingFen);
      historyAtFocusedIndex.forEach((m) => {
        if (!m.isNonMove) {
          instance.move(m.from, m.to);
        }
      });

      const nextChapterState: ChapterState = {
        ...prevChapter,
        displayFen: instance.fen,
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
      // TODO: Fix this!
      // const nextIndex = FreeBoardHistory.decrementIndexAbsolutely(action.payload.atIndex);

      const prevChapter = findLoadedChapter(prev.activityState);

      if (!prevChapter) {
        console.error('No loaded chapter');
        return prev;
      }

      const [slicedHistory, lastIndexInSlicedHistory] =
        FreeBoardHistory.sliceHistory(
          prevChapter.notation.history,
          action.payload
        );
      const nextHistory =
        FreeBoardHistory.removeTrailingNonMoves(slicedHistory);
      const nextIndex = FreeBoardHistory.findNextValidMoveIndex(
        nextHistory,
        FreeBoardHistory.incrementIndex(lastIndexInSlicedHistory),
        'left'
      );
      const instance = new ChessFENBoard(prevChapter.notation.startingFen);
      nextHistory.forEach((turn, i) => {
        turn.forEach((m) => {
          if (m.isNonMove) {
            return;
          }
          instance.move(m.from, m.to);
        });
      });
      const nextFen = instance.fen;

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

    // if (action.type === 'changeBoardOrientation') {
    //   return {
    //     ...prev,
    //     activityState: {
    //       ...prev.activityState,
    //       boardOrientation: action.payload,
    //     },
    //   };
    // }
    // if (action.type === 'arrowChange') {
    //   return {
    //     ...prev,
    //     activityState: {
    //       ...prev.activityState,
    //       arrows: action.payload,
    //     },
    //   };
    // }
    if (action.type === 'loadedChapter:setOrientation') {
      const prevChapter = findLoadedChapter(prev.activityState);

      if (!prevChapter) {
        console.error('No loaded chapter');
        return prev;
      }

      const nextChapter: Chapter = {
        ...prevChapter,
        orientation: action.payload,
      };

      return {
        ...prev,
        activityState: {
          ...prev.activityState,
          chaptersMap: {
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
      const { [circleId]: existent, ...restOfCirlesMap } =
        prevChapter.circlesMap;

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

      const nextChapter: Chapter = {
        ...prevChapter,
        displayFen: action.payload,
        arrowsMap: {},
        circlesMap: {},

        // Ensure the notation resets each time there is an update (the starting fen might change)
        notation: initialChapterState.notation,
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
    // if (action.type === 'clearCircles') {
    //   const prevChapter = findLoadedChapter(prev.activityState);

    //   if (!prevChapter) {
    //     console.error('No loaded chapter');
    //     return prev;
    //   }

    //   const nextChapter: Chapter = {
    //     ...prevChapter,
    //     circlesMap: {},
    //   };

    //   return {
    //     ...prev,
    //     activityState: {
    //       ...prev.activityState,
    //       chaptersMap: {
    //         [nextChapter.id]: nextChapter,
    //       },
    //     },
    //   };
    // }
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
      const { [action.payload.id]: prevChapter } =
        prev.activityState.chaptersMap;

      const nextChapter: Chapter = {
        ...prevChapter,
        ...action.payload.state,

        // Ensure the notation resets each time there is an update (the starting fen might change)
        notation: initialChapterState.notation,
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
  }

  return prev;
};
