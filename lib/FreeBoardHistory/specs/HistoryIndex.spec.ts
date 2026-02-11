import {
  HISTORY_WITH_FULL_LAST_TURN,
  HISTORY_WITH_HALF_LAST_TURN,
  LONG_HISTORY_WITH_FULL_LAST_TURN,
  LONG_HISTORY_WITH_PARALEL_HISTORIES,
} from './specUtils';
import { FBHHistory, FBHIndex } from '../types';
import { FreeBoardHistory as FBH } from '../FreeBoardHistory';

test('starting index', () => {
  expect(FBH.getStartingIndex()).toEqual([-1, 1]);
});

test('get last index from last half index', () => {
  const actual = FBH.getLastIndexInHistory(HISTORY_WITH_HALF_LAST_TURN);
  expect(actual).toEqual([1, 0]);
});

test('get last index from last full index', () => {
  const actual = FBH.getLastIndexInHistory(HISTORY_WITH_FULL_LAST_TURN);
  expect(actual).toEqual([0, 1]);
});

describe('Increment/Decrement', () => {
  test('increment index at turn level', () => {
    const starting: FBHIndex = [0, 0];
    const actual = FBH.incrementIndex(FBH.incrementIndex(starting));

    expect(actual).toEqual([1, 0]);
  });

  test('increment index at move level', () => {
    const starting: FBHIndex = [0, 0];
    const actual = FBH.incrementIndex(starting);

    expect(actual).toEqual([0, 1]);
  });

  test('decrement index at turn level', () => {
    const starting: FBHIndex = [2, 0];
    const actual = FBH.decrementIndex(starting);

    expect(actual).toEqual([1, 1]);
  });

  test('decrement index at move level', () => {
    const starting: FBHIndex = [2, 1];
    const actual = FBH.decrementIndex(starting);

    expect(actual).toEqual([2, 0]);
  });

  test('increment one generation nested index', () => {
    const index: FBHIndex = [0, 0, [[0, 1], 0]];
    const actual = FBH.incrementIndex(index);

    expect(actual).toEqual([0, 0, [[1, 0], 0]]);
  });

  test('increment multi-generatation nested index', () => {
    const index: FBHIndex = [0, 0, [[0, 1, [[2, 0, [[5, 1], 0]], 2]], 0]];
    const actual = FBH.incrementIndex(index);

    expect(actual).toEqual([0, 0, [[0, 1, [[2, 0, [[6, 0], 0]], 2]], 0]]);
  });

  test('decrement one generation nested index', () => {
    const index: FBHIndex = [0, 0, [[0, 1], 0]];
    const actual = FBH.decrementIndex(index);

    expect(actual).toEqual([0, 0, [[0, 0], 0]]);
  });

  test('decrement multi-generatation nested index', () => {
    const index: FBHIndex = [0, 0, [[0, 1, [[2, 0, [[5, 1], 0]], 2]], 0]];
    const actual = FBH.decrementIndex(index);

    expect(actual).toEqual([0, 0, [[0, 1, [[2, 0, [[5, 0], 0]], 2]], 0]]);
  });

  test('when decrementing hits -1 jump to the root history', () => {
    const index: FBHIndex = [0, 0, [[0, 1, [[2, 0, [[0, 0], 0]], 2]], 0]];
    const actual = FBH.decrementIndex(index);

    expect(actual).toEqual([0, 0, [[0, 1, [[2, 0], 2]], 0]]);
  });

  test('when all generations hit -1 jump to the each root history', () => {
    const index: FBHIndex = [0, 1, [[0, 0, [[0, 0, [[0, 0]]]]]]];
    const actual = FBH.decrementIndex(index);
    const expected = [0, 1, [[0, 0, [[0, 0]]]]] as FBHIndex;

    expect(actual).toEqual(expected);
  });
});

describe('Check Equality', () => {
  test('true when equal non-recursive', () => {
    expect(FBH.areIndexesEqual([0, 1], [0, 1])).toBe(true);
  });

  test('true when equal recursive', () => {
    expect(FBH.areIndexesEqual([0, 1, [[0, 1], 0]], [0, 1, [[0, 1], 0]])).toBe(
      true
    );
  });

  test('false when not equal non-recursive', () => {
    expect(FBH.areIndexesEqual([0, 1], [0, 0])).toBe(false);
    expect(FBH.areIndexesEqual([0, 0], [1, 0])).toBe(false);
  });

  test('false when not equal recursive', () => {
    expect(FBH.areIndexesEqual([0, 1, [[0, 0], 0]], [0, 1, [[0, 1], 0]])).toBe(
      false
    );
    expect(FBH.areIndexesEqual([0, 1, [[0, 1], 1]], [0, 1, [[0, 1], 0]])).toBe(
      false
    );
  });
});

describe('findNextValidMoveIndex', () => {
  describe('root history line', () => {
    test('finds the next valid move from starting position', () => {
      const actual = FBH.findNextValidMoveIndex(
        LONG_HISTORY_WITH_FULL_LAST_TURN,
        [0, 0],
        'right'
      );
      expect(actual).toEqual([0, 1]);
    });

    test('returns starting index when going back from the beginning', () => {
      const actual = FBH.findNextValidMoveIndex(
        LONG_HISTORY_WITH_FULL_LAST_TURN,
        [0, 0],
        'left'
      );
      expect(actual).toEqual([-1, 1]);
    });

    test('returns same (last) index when going further and already at the end', () => {
      const actual = FBH.findNextValidMoveIndex(
        LONG_HISTORY_WITH_FULL_LAST_TURN,
        [2, 1],
        'right'
      );
      expect(actual).toEqual([2, 1]);
    });
  });

  describe('nested', () => {
    const nestdHistoryOnBlackMove: FBHHistory = [
      [
        {
          from: 'e2',
          to: 'e4',
          color: 'w',
          san: 'e4',
        },
        {
          from: 'e7',
          to: 'e6',
          color: 'b',
          san: 'e6',
          branchedHistories: [
            [
              [
                {
                  from: 'a2',
                  to: 'a3',
                  color: 'w',
                  san: 'a3',
                },
                {
                  from: 'a7',
                  to: 'a5',
                  color: 'b',
                  san: 'a5',
                },
              ],
              [
                {
                  from: 'a3',
                  to: 'a4',
                  color: 'w',
                  san: 'a4',
                },
              ],
            ],
          ],
        },
      ],
      [
        {
          from: 'a2',
          to: 'a3',
          color: 'w',
          san: 'a3',
        },
      ],
    ];

    test('finds the next valid move from 1st nested move', () => {
      const actual = FBH.findNextValidMoveIndex(
        nestdHistoryOnBlackMove,
        [0, 1, [[0, 0]]],
        'right'
      );

      expect(actual).toEqual([0, 1, [[0, 1]]]);
    });

    test('jumps back to the ancestor line when 1st move', () => {
      const actual = FBH.findNextValidMoveIndex(
        nestdHistoryOnBlackMove,
        [0, 1, [[0, 0]]],
        'left'
      );

      expect(actual).toEqual([0, 1]);
    });

    test('returns same (last) index when going further and already at the end of the nested branch', () => {
      const actual = FBH.findNextValidMoveIndex(
        nestdHistoryOnBlackMove,
        [0, 1, [[1, 0]]],
        'right'
      );

      expect(actual).toEqual([0, 1, [[1, 0]]]);
    });
  });
});
