import {
  ChessColor,
  ChessPGN,
  DetailedChessMove,
  getNewChessGame,
  isWhiteColor,
  toShortColor,
  invoke,
} from '@xmatter/util-kit';
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
  export const getHistoryNonMoveWhite = (): FBHWhiteMove => ({
    color: 'w',
    san: '...',
    isNonMove: true,
    from: undefined,
    to: undefined,
  });

  export const getHistoryNonMove = <T extends FBHMove>(color: T['color']) =>
    ({
      color,
      san: '...',
      isNonMove: true,
      from: undefined,
      to: undefined,
    } as FBHMove); // TODO: This could be infered more

  const getHistoryIndex = (turn: number, color: ChessColor): FBHIndex => [
    turn,
    toShortColor(color) === 'b' ? 1 : 0,
  ];

  export const getStartingHistoryIndex = () => getHistoryIndex(-1, 'b');

  const isStartingHistoryIndex = (i: FBHIndex) =>
    areHistoryIndexesEqual(getStartingHistoryIndex(), i);

  export const isLastHistoryIndexInBranch = (h: FBHHistory, i: FBHIndex) =>
    !isStartingHistoryIndex(i) && // not the starting one
    areHistoryIndexesEqual(getHistoryLastIndex(h), i);

  export const areHistoryIndexesEqual = (
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
          aRecursiveIndex[1] === bRecursiveIndex[1] && // the paralels are equal
          areHistoryIndexesEqual(aRecursiveIndex[0], bRecursiveIndex[0])
        );
      }
      // return true;
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
        [incrementIndex(recursiveIndexes[0]), recursiveIndexes[1]],
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
          ? getHistoryLastIndex(nestedHistory) // -1 means last one
          : recursiveIndexes
      );
    }

    return history[turn];
  };

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

  const getHistoryLastTurn = (
    history: FBHHistory
  ): FBHRecursiveTurn | undefined => history.slice(-1)[0];

  export const getHistoryLastIndex = (
    history: FBHHistory,
    recursiveIndexes?: FBHRecursiveIndexes
  ): FBHIndex => {
    const lastTurn = getHistoryLastTurn(history);

    // The reason it's done as a tuple is so it can be spread which on undefined it becomes empty
    const recursiveIndexesTuple: [FBHRecursiveIndexes] | [] =
      typeof recursiveIndexes !== 'undefined' ? [recursiveIndexes] : [];

    if (!lastTurn) {
      return [0, 0, ...recursiveIndexesTuple];
    }

    return [
      history.length - 1,
      isHalfTurn(lastTurn) ? 0 : 1,
      ...recursiveIndexesTuple,
    ];
  };

  /**
   * Adds a move to the History at the given index (can be recursive)
   *
   * @param history
   * @param move
   * @param atIndex
   * @returns
   */
  export const addMoveToChessHistory = (
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

            const [nextHistoryBranch, nextNestedIndex] = addMoveToChessHistory(
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
            : [getHistoryNonMoveWhite(), move];

          const nextHistoryBranch: FBHRecursiveHistory = [
            // ...(prevMoveAtIndex.branchedHistories?.[0] || []),
            nextBranchedTurn,
          ] as FBHRecursiveHistory;

          const nextBranchedHistories: FBHRecursiveHistory[] = [
            ...(prevMoveAtIndex.branchedHistories || []),
            nextHistoryBranch,
          ];

          const nextRecursiveIndexes: FBHRecursiveIndexes = [
            [...getHistoryLastIndex(nextHistoryBranch)],
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
      const prevTurn = getHistoryLastTurn(history);

      if (prevTurn && isHalfTurn(prevTurn)) {
        const historyWithoutLastTurn = getHistoryAtIndex(
          history,
          decrementIndex(getHistoryLastIndex(history))
        );

        return [
          ...historyWithoutLastTurn,
          [prevTurn[0], move],
        ] as FBHRecursiveHistory;
      }

      return [...history, [move]] as FBHRecursiveHistory;
    });

    return [nextHistory, getHistoryLastIndex(nextHistory)];
  };

  /**
   * Returns the History at the given index (including the index). Returns all history if the index is greater
   *
   * @param history
   * @param toIndex inclusive
   * @returns
   */
  export const getHistoryAtIndex = (
    history: FBHHistory,
    toIndex: FBHIndex
  ): FBHHistory => {
    const [turnIndex, movePosition] = toIndex;

    // Don't return last items as it's the default for array.slice() with negative numbers
    if (turnIndex < 0) {
      return [];
    }

    const turnsToIndex = history.slice(0, turnIndex) as FBHHistory;
    const turnAtIndex = history[turnIndex];

    if (!turnAtIndex) {
      return turnsToIndex;
    }

    return [
      ...turnsToIndex,
      movePosition === 0 ? [turnAtIndex[0]] : turnAtIndex,
    ] as FBHHistory;
  };

  /**
   * Calculates the linear history up to the given (Recursive/Nested) Index
   *
   * @param history
   * @param atIndex
   * @returns
   */
  export const calculateLinearHistoryAtIndex = (
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

  export const pgnToHistory = (pgn: ChessPGN): FBHHistory =>
    linearToTurnHistory(getNewChessGame({ pgn }).history({ verbose: true }));

  const linearToTurnHistory = (
    linearHistory: DetailedChessMove[]
  ): FBHHistory => {
    type U = {
      turns: FBHHistory;
      cached: FBHWhiteMove | undefined;
    };

    // TODO: This is the most ridiculous thing, I have to recast to U each time
    //  otherwise the reducer thinks it's not the right one
    const { turns, cached } = linearHistory.reduce<U>(
      (prev, nextMove, i) => {
        // On Every half turn
        if (i % 2 === 0) {
          if (nextMove.color === 'w') {
            return {
              ...prev,
              cached: nextMove as FBHWhiteMove,
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
