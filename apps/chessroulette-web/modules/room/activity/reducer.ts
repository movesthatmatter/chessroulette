import {
  ChessArrowId,
  ChessColor,
  ChessFEN,
  ChessFENBoard,
  ChessMove,
  ChessPGN,
  ChesscircleId,
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
    currentChapterId: Chapter['id'] | undefined;
    chaptersMap: Record<Chapter['id'], Chapter>;
    chaptersIndex: number;
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
  createdAt: number;
} & ChapterState;

export type ChapterState = {
  name: string;

  // Also the chapter might get a type: position, or puzzle (containing next correct moves)

  notation?: {
    // The starting fen is the chapter fen
    history: FBHHistory;
    focusedIndex: FBHIndex;
  };
} & ChapterBoardState;

export type ChapterBoardState = {
  // Board State
  startingFen: ChessFEN; // This could be strtingPGN as well especially for puzzles but not necessarily

  // fen: ChessFEN;
  arrowsMap: ArrowsMap;
  circlesMap: CirclesMap;

  // TODO: This make required once refactored
  orientation: ChessColor;
};

export const initialChapterState: ChapterState = {
  name: 'New Chapter', // TODO: Should it have a name?
  startingFen: ChessFENBoard.STARTING_FEN,
  arrowsMap: {},
  circlesMap: {},
  notation: {
    history: [],
    focusedIndex: FreeBoardHistory.getStartingIndex(),
  },
  orientation: 'w',
};

export const initialLearnActivityState: LearnActivityState = {
  activityType: 'learn',
  activityState: {
    // boardOrientation: 'white',
    // fen: ChessFENBoard.STARTING_FEN,
    // arrows: {},
    // circles: {},
    // history: {
    //   startingFen: ChessFENBoard.STARTING_FEN,
    //   moves: [],
    //   focusedIndex: [-1, 1],
    // },
    // current: {
    //   // boardOrientation: 'white',
    //   orientation: 'white',
    //   fen: ChessFENBoard.STARTING_FEN,
    //   arrowsMap: {},
    //   circlesMap: {},
    //   notation: {
    //     startingFen: ChessFENBoard.STARTING_FEN,
    //     history: [],
    //     focusedIndex: [-1, 1],
    //   },
    // },
    currentChapterId: undefined,
    chaptersMap: {},
    chaptersIndex: 0,
  },
};

// PART 2: Action Types

export type ActivityActions =
  | Action<'createChapter', ChapterState>
  | Action<
      'updateChapter',
      {
        id: Chapter['id'];
        state: Partial<ChapterState>;
      }
    >
  | Action<'deleteChapter', { id: Chapter['id'] }>
  | Action<'playChapter', { id: Chapter['id'] }>
  | Action<'dropPiece', ChessMove>
  | Action<'importPgn', ChessPGN>
  | Action<'importFen', ChessFEN>
  | Action<'focusHistoryIndex', { index: FBHIndex }>
  | Action<'deleteHistoryMove', { atIndex: FBHIndex }>
  | Action<'changeBoardOrientation', ChessColor>
  | Action<'arrowChange', ArrowsMap>
  | Action<'drawCircle', CircleDrawTuple>
  | Action<'clearCircles'>;

// TODO: All of these are chapter based so most likely they will need to incorporate the chapter id
// | Action<'dropPiece', { chapterId?: Chapter['id']; move: ChessMove }>

// TODO: These can be compacted into one "import"
// | Action<'import', { chapterId?: Chapter['id']; input: {
//   type: 'PGN';
// } }>
// | Action<'importPgn', { chapterId?: Chapter['id']; input: ChessPGN }>
// | Action<'importFen', { chapterId?: Chapter['id']; input: ChessFEN }>
// | Action<'focusHistoryIndex', { chapterId?: Chapter['id']; index: FBHIndex }>
// | Action<
//     'deleteHistoryMove',
//     { chapterId?: Chapter['id']; atIndex: FBHIndex }
//   >
// | Action<
//     'changeBoardOrientation',
//     { chapterId?: Chapter['id']; color: ChessColor }
//   >
// | Action<'arrowChange', { chapterId?: Chapter['id']; arrowsMap: ArrowsMap }>
// | Action<'drawCircle', { chapterId?: Chapter['id']; circle: CircleDrawTuple }>
// | Action<'clearCircles', { chapterId?: Chapter['id'] }>;

// PART 3: The Reducer – This is where all the logic happens

export default (
  prev: ActivityState = initialActivtityState,
  action: ActivityActions
): ActivityState => {
  console.group('Action', action.type);
  console.log('payload', (action as any).payload);
  console.log('prev', prev);
  console.log('');
  console.groupEnd();

  if (prev.activityType === 'learn') {
    // TODO: Should this be split?
    // if (action.type === 'dropPiece') {
    //   // TODO: the logic for this should be in GameHistory class/static  so it can be tested
    //   try {
    //     const { from, to, promoteTo } = action.payload.move;
    //     const chapter = [prev.activityState.chaptersMap];
    //     const instance = new ChessFENBoard(prev.activityState.fen);
    //     const fenPiece = instance.piece(from);
    //     if (!fenPiece) {
    //       console.error('Err', instance.board);
    //       throw new Error(`No Piece at ${from}`);
    //     }
    //     const promoteToFenBoardPiecesymbol:
    //       | FenBoardPromotionalPieceSymbol
    //       | undefined = promoteTo
    //       ? (pieceSanToFenBoardPieceSymbol(
    //           promoteTo
    //         ) as FenBoardPromotionalPieceSymbol)
    //       : undefined;
    //     const nextMove = instance.move(
    //       from,
    //       to,
    //       promoteToFenBoardPiecesymbol
    //     ) as FBHMove;
    //     const prevMove = FreeBoardHistory.findMoveAtIndex(
    //       prev.activityState.history.moves,
    //       prev.activityState.history.focusedIndex
    //     );
    //     const { moves: prevHistoryMoves, focusedIndex: prevFocusedIndex } =
    //       prev.activityState.history;
    //     // If the moves are the same introduce a non move
    //     const [nextHistory, addedAtIndex] = invoke(() => {
    //       const isFocusedIndexLastInBranch =
    //         FreeBoardHistory.isLastIndexInHistoryBranch(
    //           prevHistoryMoves,
    //           prevFocusedIndex
    //         );
    //       const [_, __, prevFocusRecursiveIndexes] = prevFocusedIndex;
    //       if (prevFocusRecursiveIndexes) {
    //         const addAtIndex =
    //           FreeBoardHistory.incrementIndex(prevFocusedIndex);
    //         if (prevMove?.color === nextMove.color) {
    //           const [nextHistory, addedAtIndex] = FreeBoardHistory.addMove(
    //             prev.activityState.history.moves,
    //             FreeBoardHistory.getNonMove(swapColor(nextMove.color)),
    //             addAtIndex
    //           );
    //           return FreeBoardHistory.addMove(
    //             nextHistory,
    //             nextMove,
    //             FreeBoardHistory.incrementIndex(addedAtIndex)
    //           );
    //         }
    //         return FreeBoardHistory.addMove(
    //           prev.activityState.history.moves,
    //           nextMove,
    //           addAtIndex
    //         );
    //       }
    //       const addAtIndex = isFocusedIndexLastInBranch
    //         ? FreeBoardHistory.incrementIndex(
    //             prev.activityState.history.focusedIndex
    //           )
    //         : prev.activityState.history.focusedIndex;
    //       // if 1st move is black add a non move
    //       if (prevHistoryMoves.length === 0 && nextMove.color === 'b') {
    //         const [nextHistory] = FreeBoardHistory.addMove(
    //           prev.activityState.history.moves,
    //           FreeBoardHistory.getNonMove(swapColor(nextMove.color))
    //         );
    //         return FreeBoardHistory.addMove(nextHistory, nextMove);
    //       }
    //       // If it's not the last branch
    //       if (!isFocusedIndexLastInBranch) {
    //         return FreeBoardHistory.addMove(
    //           prev.activityState.history.moves,
    //           nextMove,
    //           prevFocusedIndex
    //         );
    //       }
    //       // Add nonMoves for skipping one
    //       if (prevMove?.color === nextMove.color) {
    //         const [nextHistory] = FreeBoardHistory.addMove(
    //           prev.activityState.history.moves,
    //           FreeBoardHistory.getNonMove(swapColor(nextMove.color)),
    //           addAtIndex
    //         );
    //         return FreeBoardHistory.addMove(nextHistory, nextMove);
    //       }
    //       return FreeBoardHistory.addMove(
    //         prev.activityState.history.moves,
    //         nextMove
    //       );
    //     });
    //     return {
    //       ...prev,
    //       activityState: {
    //         ...prev.activityState,
    //         fen: instance.fen,
    //         circles: {},
    //         arrows: {},
    //         history: {
    //           ...prev.activityState.history,
    //           moves: nextHistory,
    //           focusedIndex: addedAtIndex,
    //         },
    //       },
    //     };
    //   } catch (e) {
    //     console.error('failed', e);
    //     return prev;
    //   }
    // }
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
    // } else if (action.type === 'focusHistoryIndex') {
    //   const historyAtFocusedIndex =
    //     FreeBoardHistory.calculateLinearHistoryToIndex(
    //       prev.activityState.history.moves,
    //       action.payload.index
    //     );
    //   const instance = new ChessFENBoard(
    //     prev.activityState.history.startingFen
    //   );
    //   historyAtFocusedIndex.forEach((m) => {
    //     if (!m.isNonMove) {
    //       instance.move(m.from, m.to);
    //     }
    //   });
    //   return {
    //     ...prev,
    //     activityState: {
    //       ...prev.activityState,
    //       fen: instance.fen,
    //       history: {
    //         ...prev.activityState.history,
    //         focusedIndex: action.payload.index,
    //       },
    //     },
    //   };
    // }
    // if (action.type === 'deleteHistoryMove') {
    //   // TODO: Fix this!
    //   // const nextIndex = FreeBoardHistory.decrementIndexAbsolutely(action.payload.atIndex);
    //   const [slicedHistory, lastIndexInSlicedHistory] =
    //     FreeBoardHistory.sliceHistory(
    //       prev.activityState.history.moves,
    //       action.payload.atIndex
    //     );
    //   const nextHistory =
    //     FreeBoardHistory.removeTrailingNonMoves(slicedHistory);
    //   const nextIndex = FreeBoardHistory.findNextValidMoveIndex(
    //     nextHistory,
    //     FreeBoardHistory.incrementIndex(lastIndexInSlicedHistory),
    //     'left'
    //   );
    //   const instance = new ChessFENBoard(
    //     prev.activityState.history.startingFen
    //   );
    //   nextHistory.forEach((turn, i) => {
    //     turn.forEach((m) => {
    //       if (m.isNonMove) {
    //         return;
    //       }
    //       instance.move(m.from, m.to);
    //     });
    //   });
    //   const nextFen = instance.fen;
    //   return {
    //     ...prev,
    //     activityState: {
    //       ...prev.activityState,
    //       circles: {},
    //       arrows: {},
    //       fen: nextFen,
    //       history: {
    //         ...prev.activityState.history,
    //         focusedIndex: nextIndex,
    //         moves: nextHistory,
    //       },
    //     },
    //   };
    // }
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
    // if (action.type === 'drawCircle') {
    //   const [at, hex] = action.payload;
    //   const circleId = `${at}`;
    //   const { [circleId]: existent, ...restOfCirles } =
    //     prev.activityState.circles;
    //   return {
    //     ...prev,
    //     activityState: {
    //       ...prev.activityState,
    //       circles: {
    //         ...restOfCirles,
    //         ...(!!existent
    //           ? undefined // Set it to undefined if same
    //           : { [circleId]: action.payload }),
    //       },
    //     },
    //   };
    // }
    // if (action.type === 'clearCircles') {
    //   return {
    //     ...prev,
    //     activityState: {
    //       ...prev.activityState,
    //       circles: {},
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
              createdAt: new Date().getTime(),
              ...action.payload,
            },
          },
          chaptersIndex: nextChapterIndex,
        },
      };
    }
    // if (action.type === 'updateChapter') {
    //   const { [action.payload.id]: prevChapter } =
    //     prev.activityState.chaptersMap;
    //   return {
    //     ...prev,
    //     activityState: {
    //       ...prev.activityState,
    //       chaptersMap: {
    //         ...prev.activityState.chaptersMap,
    //         [action.payload.id]: {
    //           ...prevChapter,
    //           ...action.payload.state,
    //         },
    //       },
    //     },
    //   };
    // }
    if (action.type === 'deleteChapter') {
      const { [action.payload.id]: removed, ...nextChapters } =
        prev.activityState.chaptersMap;
      return {
        ...prev,
        activityState: {
          ...prev.activityState,
          chaptersMap: nextChapters,
        },
      };
    }
    // if (action.type === 'playChapter') {
    //   const { [action.payload.id]: chapter } = prev.activityState.chaptersMap;
    //   if (!chapter) {
    //     return prev;
    //   }
    //   return {
    //     ...prev,
    //     activityState: {
    //       ...prev.activityState,
    //       fen: chapter.fen,
    //       arrows: chapter.arrowsMap || {},
    //       circles: chapter.circlesMap || {},
    //       // boardOrientation: chapter.orientation,
    //     },
    //   };
    // }
  }

  return prev;
};
