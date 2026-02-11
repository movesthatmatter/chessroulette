import {
  ChessColor,
  ChessFEN,
  ChessPGN,
  DetailedChessMove,
  getNewChessGame,
  isWhiteColor,
} from '../ChessRouler';
import {
  ChessFENBoard,
  detailedChessMoveToFreeBoardDetailedChessMove,
  swapColor,
} from '../ChessFENBoard';
import { invoke } from '../misc';
import type {
  FBHIndex,
  FBHMove,
  FBHRecursiveIndexes,
  FBHTurn,
  FBHWhiteMove,
  FBHHistory,
  FBHLinearHistory,
  FBHNonRecursiveIndex,
  FBHRecursiveFullTurn,
  FBHRecursiveHalfTurn,
  FBHRecursiveIndex,
  FBHRecursiveMove,
  FBHRecursiveTurn,
  FBHRecursiveHistory,
} from './types';

export namespace FreeBoardHistory {
  export const getWhiteNonMove = (): FBHWhiteMove => ({
    color: 'w',
    san: '...',
    isNonMove: true,
    from: undefined,
    to: undefined,
  });

  export const getNonMove = <T extends FBHMove>(color: T['color']) =>
    ({
      color,
      san: '...',
      isNonMove: true,
      from: undefined,
      to: undefined,
    } as FBHMove); // TODO: This could be infered more

  const createIndex = (turn: number, color: ChessColor): FBHIndex => [
    turn,
    color === 'b' ? 1 : 0,
  ];

  export const getStartingIndex = () => createIndex(-1, 'b');

  const isStartingHistoryIndex = (i: FBHIndex) =>
    areIndexesEqual(getStartingIndex(), i);

  export const isLastIndexInHistoryBranch = (h: FBHHistory, i: FBHIndex) =>
    !isStartingHistoryIndex(i) && // not the starting one
    areIndexesEqual(getLastIndexInHistory(h), i);

  export const areIndexesEqual = (
    a: FBHIndex | -1,
    b: FBHIndex | -1
  ): boolean => {
    if (a === -1 || b === -1) {
      return a === b;
    }

    const [aTurnIndex, aMoveIndex, aRecursiveIndex] = a;
    const [bTurnIndex, bMoveIndex, bRecursiveIndex] = b;

    const recursivesAreEqual = () => {
      if (aRecursiveIndex && bRecursiveIndex) {
        return (
          aRecursiveIndex[1] === bRecursiveIndex[1] && // the parallel history branches are equal
          areIndexesEqual(aRecursiveIndex[0], bRecursiveIndex[0])
        );
      }

      return typeof aRecursiveIndex === typeof bRecursiveIndex;
    };

    return !!(
      aTurnIndex === bTurnIndex &&
      aMoveIndex === bMoveIndex &&
      recursivesAreEqual()
    );
  };

  export const incrementIndex = ([
    turn,
    move,
    recursiveIndexes,
  ]: FBHIndex): FBHIndex => {
    if (recursiveIndexes) {
      if (recursiveIndexes[0] === -1) {
        throw new Error('This is not good. need to change it from -1');
      }

      return [
        turn,
        move,
        recursiveIndexes[1] !== undefined
          ? [incrementIndex(recursiveIndexes[0]), recursiveIndexes[1]]
          : [incrementIndex(recursiveIndexes[0])], // don't add undefined for the 2nd position
      ];
    }

    return incrementNonRecursiveIndex([turn, move]);
  };

  const incrementNonRecursiveIndex = ([turn, move]: FBHIndex) =>
    (move === 1 ? [turn + 1, 0] : [turn, move + 1]) as FBHIndex;

  export const decrementIndex = ([
    turn,
    move,
    recursiveIndexes,
  ]: FBHIndex): FBHIndex => {
    if (recursiveIndexes) {
      if (recursiveIndexes[0] === -1) {
        throw new Error('This is not good. need to change it from -1');
      }

      const nestedIndex = decrementIndex(recursiveIndexes[0]);

      // If went down, remove it and go to the upper generation
      if (nestedIndex[0] === -1) {
        return [turn, move];
      }

      return [
        turn,
        move,
        [decrementIndex(recursiveIndexes[0]), recursiveIndexes[1]],
      ];
    }

    return decrementNonRecursiveIndex([turn, move]);
  };

  export const decrementIndexAbsolutely = ([
    turn,
    move,
    recursiveIndexes,
  ]: FBHIndex): FBHIndex => {
    if (recursiveIndexes) {
      if (recursiveIndexes[0] === -1) {
        throw new Error('This is not good. need to change it from -1');
      }

      return [
        turn,
        move,
        [decrementIndexAbsolutely(recursiveIndexes[0]), recursiveIndexes[1]],
      ];
    }

    return decrementNonRecursiveIndex([turn, move]);
  };

  const decrementNonRecursiveIndex = ([turn, move]: FBHIndex) =>
    (move === 1 ? [turn, move - 1] : [turn - 1, 1]) as FBHIndex;

  export const findMoveAtIndex = (history: FBHHistory, atIndex: FBHIndex) => {
    const turn = findTurnAtIndex(history, atIndex);

    if (!turn) {
      return undefined;
    }

    return turn[getDeepestIndex(atIndex)[1]];
  };

  const findMoveAtIndexNonRecursively = (
    history: FBHHistory,
    atIndex: FBHIndex
  ) => findTurnAtIndexNonRecursively(history, atIndex)?.[atIndex[1]];

  const findTurnAtIndexNonRecursively = (
    history: FBHHistory,
    [turnIndex]: FBHIndex
  ) => history[turnIndex];

  /**
   * Finds the turn at the given index recursively
   *
   * @param history
   * @param index
   * @returns
   */
  const findTurnAtIndex = (
    history: FBHHistory,
    [turn, movePosition, recursiveHistoryIndex]: FBHIndex
  ): FBHTurn | undefined => {
    if (recursiveHistoryIndex) {
      const [recursiveIndexes, paralelBranchIndex = 0] = recursiveHistoryIndex;

      const nestedHistory =
        history[turn][movePosition]?.branchedHistories?.[paralelBranchIndex];

      if (!nestedHistory) {
        return undefined;
      }

      return findTurnAtIndex(
        nestedHistory,
        recursiveIndexes === -1
          ? getLastIndexInHistory(nestedHistory) // -1 means last one
          : recursiveIndexes
      );
    }

    return history[turn];
  };

  /**
   * Finds the deepest (non-nested) index in the given index
   *
   * @param index
   * @returns
   */
  const getDeepestIndex = (index: FBHRecursiveIndex): FBHNonRecursiveIndex => {
    const nextNestedIndex = getNextDeepIndex(index);

    return nextNestedIndex
      ? getDeepestIndex(nextNestedIndex)
      : (index as FBHNonRecursiveIndex);
  };

  const getNextDeepIndex = ([_, __, nestedIndex]: FBHRecursiveIndex):
    | FBHRecursiveIndex
    | undefined => {
    if (!nestedIndex) {
      return undefined;
    }

    if (nestedIndex[0] === -1) {
      return undefined;
    }

    return nestedIndex[0];
  };

  const getLastTurnInHistory = (
    history: FBHHistory
  ): FBHRecursiveTurn | undefined => history.slice(-1)[0];

  /**
   * Returns the last index of the given history (non recursive)
   *
   * @param history
   * @returns
   */
  export const getLastIndexInHistory = (history: FBHHistory): FBHIndex => {
    const lastTurn = getLastTurnInHistory(history);

    if (!lastTurn) {
      return getStartingIndex();
    }

    return [history.length - 1, isHalfTurn(lastTurn) ? 0 : 1];
  };

  /**
   * This adds any invalid/magic moves
   * Meaning pieces can jump from any square to any, move back as well as move in a row for the same color
   *
   * @param history
   * @param atIndex
   * @param move
   * @returns
   */
  export const addMagicMove = (
    {
      history,
      atIndex,
    }: {
      history: FBHRecursiveHistory;
      atIndex: FBHIndex;
    },
    move: FBHMove
  ) => {
    // if 1st move is black add a non move
    if (history.length === 0 && move.color === 'b') {
      const [nextHistory] = addMove(history, getNonMove(swapColor(move.color)));
      return addMove(nextHistory, move);
    }

    const prevMove = findMoveAtIndex(history, atIndex);
    const atIncrementedIndex = incrementIndex(atIndex);
    const isLast = !findMoveAtIndex(history, atIncrementedIndex);

    // Append moves at the end of the linear hisory
    return addMoveWithNonMove({
      history,
      move,
      atIndex: isLast ? atIncrementedIndex : atIndex, // if last append, otherwise nest
      prevMove,
    });
  };

  /**
   * Adds non moves when two consecutive moves have similar color
   *
   * @param param0
   * @returns
   */
  const addMoveWithNonMove = ({
    history,
    move,
    atIndex,
    prevMove,
  }: {
    history: FBHHistory;
    move: FBHMove;
    atIndex: FBHIndex;
    prevMove: FBHMove | undefined;
  }) => {
    // Add nonMoves for skipping one
    if (prevMove?.color === move.color) {
      const [nextHistory, nextIndex] = addMove(
        history,
        getNonMove(swapColor(move.color)),
        atIndex
      );
      return addMove(nextHistory, move, incrementIndex(nextIndex));
    }

    return addMove(history, move, atIndex);
  };

  /**
   * Adds a move to the History at the given index (can be recursive)
   *
   * @param history
   * @param move
   * @param atIndex
   * @returns
   */
  export const addMove = (
    history: FBHRecursiveHistory,
    move: FBHMove,
    atIndex?: FBHIndex
  ): [nextHistory: FBHRecursiveHistory, nextIndex: FBHIndex] => {
    const hasMoveAtIndex =
      atIndex && findMoveAtIndexNonRecursively(history, atIndex);
    const isNested = !!hasMoveAtIndex;

    // Branched History
    if (isNested) {
      const [turnIndex, moveIndex, recursiveIndexes] = atIndex;
      const prevMoveAtIndex = findMoveAtIndexNonRecursively(history, [
        turnIndex,
        moveIndex,
      ]);

      // if move isn't find return Prev
      if (!prevMoveAtIndex) {
        // console.log('and fails here');
        // TODO: Add test case for this
        throw new Error(
          'AddMoveToChessHistory() Error: This should not happen'
        );
      }

      //TODO: Add use case for when there already are branched histories
      // This is where it becomes recursive

      const prevTurnAtIndex = findTurnAtIndexNonRecursively(history, atIndex);

      if (!prevTurnAtIndex) {
        throw new Error('This should not happen b/c findMoveAtIndex() exists');
      }

      const { nextBranchedHistories, nextIndex } = invoke(
        (): {
          nextBranchedHistories: FBHHistory[];
          nextIndex: FBHIndex;
        } => {
          // Recursive
          if (recursiveIndexes) {
            // Add a Nested Branch
            const [recursiveHistoryIndex, paralelBranchesIndex = 0] =
              recursiveIndexes;

            const [nextHistoryBranch, nextNestedIndex] = addMove(
              prevMoveAtIndex.branchedHistories?.[paralelBranchesIndex] || [],
              move,
              recursiveHistoryIndex === -1 ? undefined : recursiveHistoryIndex
            );

            const nextBranchedHistories: FBHRecursiveHistory[] = [
              ...(prevMoveAtIndex.branchedHistories || []).slice(
                0,
                paralelBranchesIndex
              ),
              nextHistoryBranch,
              ...(prevMoveAtIndex.branchedHistories || []).slice(
                paralelBranchesIndex + 1
              ),
            ];

            return {
              nextBranchedHistories,
              nextIndex: [
                turnIndex,
                moveIndex,
                [nextNestedIndex, paralelBranchesIndex],
              ],
            };
          }

          // Add Parallel branch

          const nextBranchedTurn: FBHRecursiveTurn = isWhiteMove(move)
            ? [move]
            : [getWhiteNonMove(), move];

          const nextHistoryBranch: FBHRecursiveHistory = [
            // ...(prevMoveAtIndex.branchedHistories?.[0] || []),
            nextBranchedTurn,
          ] as FBHRecursiveHistory;

          const nextBranchedHistories: FBHRecursiveHistory[] = [
            ...(prevMoveAtIndex.branchedHistories || []),
            nextHistoryBranch,
          ];

          const nextRecursiveIndexes: FBHRecursiveIndexes = [
            [...getLastIndexInHistory(nextHistoryBranch)],
            nextBranchedHistories.length - 1, // The last branch
          ];

          const nextIndex: FBHRecursiveIndex = [
            turnIndex,
            moveIndex,
            nextRecursiveIndexes,
          ];

          return { nextBranchedHistories, nextIndex };
        }
      );

      const nextMove: FBHRecursiveMove = {
        ...prevMoveAtIndex,
        branchedHistories: nextBranchedHistories,
      };

      const nextTurn: FBHRecursiveTurn = updateOrInsertMoveInTurn(
        prevTurnAtIndex,
        nextMove
      );

      const nextHistory: FBHRecursiveHistory = [
        ...history.slice(0, turnIndex),
        nextTurn,
        ...history.slice(turnIndex + 1),
      ] as FBHRecursiveHistory;

      return [nextHistory, nextIndex];
    }

    // Linear

    const nextHistory = invoke(() => {
      const prevTurn = getLastTurnInHistory(history);

      if (prevTurn && isHalfTurn(prevTurn)) {
        const [historyWithoutLastTurn] = sliceHistory(
          history,
          getLastIndexInHistory(history)
        );

        return [
          ...historyWithoutLastTurn,
          [prevTurn[0], move],
        ] as FBHRecursiveHistory;
      }

      return [...history, [move]] as FBHRecursiveHistory;
    });

    return [nextHistory, getLastIndexInHistory(nextHistory)];
  };

  const isIndexLowerThan = (a: FBHIndex, b: FBHIndex): boolean => {
    if (a[0] < b[0]) {
      return true;
    }

    if (a[0] === b[0] && a[1] < b[1]) {
      return true;
    }

    // If they both have recursivity, check it as well
    if (
      a[0] === b[0] &&
      a[1] === b[1] &&
      a[2] &&
      b[2] &&
      a[2][0] !== -1 &&
      b[2][0] !== -1
    ) {
      return isIndexLowerThan(a[2][0], b[2][0]);
    }

    return false;
  };

  /**
   * Returns the History at the given index (including the index).
   *  Returns all history if the index is greater
   *
   * @param history
   * @param toIndex inclusive
   * @returns
   */
  export const sliceHistory = (
    history: FBHHistory,
    toIndex: FBHIndex
  ): [nextHistory: FBHHistory, lastIndexInHistory: FBHIndex] => {
    const [turnIndex, movePosition, recursiveIndexes] = toIndex;

    if (recursiveIndexes) {
      const [nestedIndex, branchIndex = 0] = recursiveIndexes;

      if (nestedIndex === -1) {
        return [history, getLastIndexInHistory(history)];
      }

      const turnsToIndexExclusively = history.slice(0, turnIndex) as FBHHistory;
      const turnAtIndex = history[turnIndex];

      // Return early if the index is longer than the history length
      if (!turnAtIndex) {
        return [
          turnsToIndexExclusively,
          getLastIndexInHistory(turnsToIndexExclusively),
        ];
      }

      const moveAtIndex = turnAtIndex[movePosition];

      // If the branchedHistory doesn't exist than return the full history
      if (!moveAtIndex?.branchedHistories?.[branchIndex]) {
        return [history, getLastIndexInHistory(history)];
      }

      const [nextBranch, slicedAtNestedIndex] = sliceHistory(
        moveAtIndex.branchedHistories[branchIndex],
        nestedIndex
      );

      const nextBranchedHistories = [
        ...moveAtIndex.branchedHistories.slice(0, branchIndex),
        ...(nextBranch.length > 0 ? [nextBranch] : []), // Ensures the empty arrays doesn't get added
        ...moveAtIndex.branchedHistories.slice(branchIndex + 1),
      ];

      const nextMove: FBHRecursiveMove = {
        ...moveAtIndex,
        branchedHistories:
          nextBranchedHistories.length > 0 ? nextBranchedHistories : undefined,
      };

      const nextTurn =
        movePosition === 0
          ? [nextMove, turnAtIndex[1]]
          : [turnAtIndex[0], nextMove];

      const nextHistory = [
        ...turnsToIndexExclusively,
        nextTurn,
        ...(history.slice(turnIndex + 1) as FBHHistory), // turnsFromIndex
      ] as FBHHistory;

      return [
        nextHistory,
        [
          turnIndex,
          movePosition,
          // Don't add the nested index if starting position, instead let it jump to the root generation
          areIndexesEqual(slicedAtNestedIndex, getStartingIndex())
            ? undefined
            : // Don't add the branch index if 0
              [slicedAtNestedIndex, branchIndex > 0 ? branchIndex : undefined],
        ],
      ];
    }

    if (isIndexLowerThan(toIndex, [0, 1])) {
      return [[], getStartingIndex()];
    }

    // Don't return last items as it's the default for array.slice() with negative numbers

    const [decTurnIndex, decMovePosition] = decrementIndexAbsolutely([
      turnIndex,
      movePosition,
    ]);

    const turnsToIndexExclusively = history.slice(
      0,
      decTurnIndex
    ) as FBHHistory;
    const turnAtIndex = history[decTurnIndex];

    // Return early if the index is longer than the history length
    if (!turnAtIndex) {
      return [
        turnsToIndexExclusively,
        getLastIndexInHistory(turnsToIndexExclusively),
      ];
    }

    const nextHistory = [
      ...turnsToIndexExclusively,
      decMovePosition === 0 ? [turnAtIndex[0]] : turnAtIndex,
    ] as FBHHistory;

    return [nextHistory, getLastIndexInHistory(nextHistory)];
  };

  /**
   * Remvoes trailing non-moves in history
   *  Does not remove non moves in the middle of history
   *
   * @param history
   */
  export const removeTrailingNonMoves = (history: FBHHistory): FBHHistory => {
    const lastTurn = getLastTurnInHistory(history);

    if (!lastTurn) {
      return history;
    }

    const [whiteMove, blackMove] = lastTurn;

    const baseHistory = history.slice(0, -1) as FBHHistory;

    if (!blackMove) {
      if (whiteMove.isNonMove) {
        return removeTrailingNonMoves(baseHistory);
      }
    } else if (blackMove.isNonMove) {
      return removeTrailingNonMoves([
        ...baseHistory,
        [whiteMove],
      ] as FBHHistory);
    }

    return history;
  };

  /**
   * Calculates the linear history up to the given (Recursive/Nested) Index
   *
   * @param history
   * @param atIndex
   * @returns
   */
  export const calculateLinearHistoryToIndex = (
    history: FBHHistory,
    atIndex: FBHIndex
  ): FBHLinearHistory => {
    const appendMovesRecursively = (
      index: FBHIndex,
      cache: FBHLinearHistory = []
    ): FBHLinearHistory => {
      const moveAtIndex = findMoveAtIndex(history, index);

      if (!moveAtIndex) {
        return cache;
      }

      // Skip if the move is a non move
      if (moveAtIndex.isNonMove) {
        return [
          ...appendMovesRecursively(decrementIndex(index), cache),
        ] as FBHLinearHistory;
      }

      // Take the branchedHistories out
      const { branchedHistories, ...moveAtIndexWithoutNested } = moveAtIndex;

      return [
        ...appendMovesRecursively(decrementIndex(index), cache),
        moveAtIndexWithoutNested,
      ] as FBHLinearHistory;
    };

    return appendMovesRecursively(atIndex);
  };

  const updateOrInsertMoveInTurn = <T extends FBHRecursiveTurn>(
    turn: T,
    move: FBHMove
  ): T => (isWhiteMove(move) ? [move, ...turn.slice(1)] : [turn[0], move]) as T;

  const isFullTurn = (mt: FBHRecursiveTurn): mt is FBHRecursiveFullTurn =>
    !!mt[1];

  const isHalfTurn = (mt: FBHRecursiveTurn): mt is FBHRecursiveHalfTurn =>
    !isFullTurn(mt);

  const isWhiteMove = (m: FBHMove): m is FBHWhiteMove => isWhiteColor(m.color);

  /**
   * Transforms a pgn tp FreeBoardHistory
   *
   * @param pgn
   * @returns
   */
  export const pgnToHistory = (pgn: ChessPGN): FBHHistory =>
    linearToTurnHistory(getNewChessGame({ pgn }).history({ verbose: true }));

  export const historyToFen = (
    h: FBHHistory,
    startingFen = ChessFENBoard.STARTING_FEN
  ): ChessFEN => {
    const fenBoard = new ChessFENBoard(startingFen);
    h.forEach(([wM, bM]) => {
      if (!wM.isNonMove) {
        fenBoard.move(wM);
      }

      if (bM && !bM.isNonMove) {
        fenBoard.move(bM);
      }
    });

    return fenBoard.fen;
  };

  const linearToTurnHistory = (
    linearHistory: DetailedChessMove[]
  ): FBHHistory => {
    type U = {
      turns: FBHHistory;
      cached: FBHWhiteMove | undefined;
    };

    // TODO: This is the most ridiculous thing, I have to recast to U each time
    //  otherwise the reducer thinks it's not the right one
    const { turns, cached } = linearHistory
      // This step is super important in order to transform the detailedMoves into FreeBoardDetailedChessMove
      .map(detailedChessMoveToFreeBoardDetailedChessMove)
      .reduce<U>(
        (prev, nextMove, i) => {
          // On Every half turn
          if (i % 2 === 0) {
            if (nextMove.color === 'w') {
              return {
                ...prev,
                cached: nextMove,
              };
            } else {
              // TODO: If the next move is not white this is an error
              // TODO: This is actually not an error but a thing in FBH, so it can simply add a non move and go with it
              throw new Error(
                `LinearToTurnHistory Error: Move (${i}) ${nextMove.from} ${nextMove.to} is not of correct color!`
              );
            }
          }

          // On Every Full Turn
          const nextTurn = [prev.cached, nextMove];

          return {
            cached: undefined,
            turns: [...prev.turns, nextTurn],
          } as U;
        },
        { turns: [], cached: undefined }
      );

    return cached ? ([...turns, [cached]] as FBHHistory) : turns;
  };

  /**
   * If there are non-moves, it skips over them
   *
   * @param index
   * @param dir
   * @returns
   */
  export const findNextValidMoveIndex = (
    history: FBHHistory,
    index: FBHIndex,
    dir: 'left' | 'right'
  ): FBHIndex => {
    if (history.length === 0) {
      return FreeBoardHistory.getStartingIndex();
    }

    const nextIndex =
      dir === 'right'
        ? FreeBoardHistory.incrementIndex(index)
        : FreeBoardHistory.decrementIndex(index);

    const foundMove = FreeBoardHistory.findMoveAtIndex(history, nextIndex);

    // If there is no move at the next index it means it's out of boundaries,
    //  and it's safe to stop
    if (!foundMove) {
      // If going backwards, return the next (starting) index
      if (dir === 'left') {
        return nextIndex;
      }

      return index;
    }

    if (foundMove.isNonMove) {
      return findNextValidMoveIndex(history, nextIndex, dir);
    }

    return nextIndex;
  };

  export const renderIndex = ([turn, move, nestedIndex]: FBHIndex): string => {
    const nested = invoke(() => {
      if (!nestedIndex) {
        return '';
      }

      if (nestedIndex[0] === -1) {
        return ' -1';
      }

      return (
        ', ' +
        renderIndex(nestedIndex[0]) +
        (nestedIndex[1] && nestedIndex[1] > 0 ? `:${nestedIndex[1]}` : '')
        // + ']'
      );
    });

    // TODO: This doesn't take care of the branches

    return `[${turn}, ${move}${nested}]`;
  };
}
