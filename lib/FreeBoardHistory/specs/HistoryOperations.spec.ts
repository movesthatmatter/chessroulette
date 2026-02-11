import {
  HISTORY_WITH_FULL_LAST_TURN,
  LONG_HISTORY_WITH_HALF_LAST_TURN,
} from './specUtils';
import { FBHHistory } from '../types';
import { FreeBoardHistory as FBH } from '../FreeBoardHistory';

describe('Slice History', () => {
  test('Gets an empty history when the index is below starting', () => {
    const [actualHistory, actualIndex] = FBH.sliceHistory(
      LONG_HISTORY_WITH_HALF_LAST_TURN,
      [0, 0]
    );

    expect(actualHistory).toEqual([]);
    expect(actualIndex).toEqual([-1, 1]);
  });

  test('gets only the first move when the index is Starting Index', () => {
    const [actualHistory, actualIndex] = FBH.sliceHistory(
      LONG_HISTORY_WITH_HALF_LAST_TURN,
      [0, 1]
    );

    expect(actualHistory).toEqual([
      [
        {
          from: 'e2',
          to: 'e4',
          color: 'w',
          san: 'e4',
        },
      ],
    ]);
    expect(actualIndex).toEqual([0, 0]);
  });

  test('get the first turn when index is at the first full turn', () => {
    const [actualHistory, actualIndex] = FBH.sliceHistory(
      LONG_HISTORY_WITH_HALF_LAST_TURN,
      [1, 0]
    );

    expect(actualHistory).toEqual([
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
        },
      ],
    ]);
    expect(actualIndex).toEqual([0, 1]);
  });

  test('at Half Turn Index ', () => {
    const [actualHistory, actualIndex] = FBH.sliceHistory(
      LONG_HISTORY_WITH_HALF_LAST_TURN,
      [1, 1]
    );

    expect(actualHistory).toEqual([
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
        },
      ],
      [
        {
          from: 'd2',
          to: 'd4',
          color: 'w',
          san: 'd4',
        },
      ],
    ]);
    expect(actualIndex).toEqual([1, 0]);
  });

  test('at Full Turn Index ', () => {
    const [actualHistory, actualIndex] = FBH.sliceHistory(
      LONG_HISTORY_WITH_HALF_LAST_TURN,
      [2, 0]
    );

    expect(actualHistory).toEqual([
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
        },
      ],
      [
        {
          from: 'd2',
          to: 'd4',
          color: 'w',
          san: 'd4',
        },
        {
          from: 'd7',
          to: 'd5',
          color: 'b',
          san: 'd5',
        },
      ],
    ]);
    expect(actualIndex).toEqual([1, 1]);
  });

  test('gets full history when Index longer than history length', () => {
    const [actualHistory, actualIndex] = FBH.sliceHistory(
      LONG_HISTORY_WITH_HALF_LAST_TURN,
      [99, 1]
    );

    expect(actualHistory).toEqual(LONG_HISTORY_WITH_HALF_LAST_TURN);
    expect(actualIndex).toEqual([3, 0]); // The actual last index of the history
  });

  describe('Rrcursivity', () => {
    test('from first nested branch', () => {
      const nestedHistory = [
        [
          {
            from: 'd2',
            to: 'd4',
            san: 'd4',
            color: 'w',
            branchedHistories: [
              [
                [
                  {
                    isNonMove: true,
                    san: '...',
                    color: 'w',
                  },
                  {
                    from: 'b7',
                    to: 'b5',
                    color: 'b',
                    san: 'b5',
                    branchedHistories: [
                      [
                        [
                          {
                            from: 'b2',
                            to: 'b4',
                            color: 'w',
                            san: 'b4',
                          },
                          {
                            from: 'c7',
                            to: 'c6',
                            color: 'b',
                            san: 'c4',
                          },
                        ],
                      ],
                    ],
                  },
                ],
              ],
            ],
          },
          {
            from: 'd7',
            to: 'd5',
            san: 'd5',
            color: 'b',
          },
        ],
      ] satisfies FBHHistory;

      const [actualHistory, actualIndex] = FBH.sliceHistory(nestedHistory, [
        0,
        0,
        [[0, 1, [[0, 1]]]],
      ]);

      const expected = [
        [
          {
            from: 'd2',
            to: 'd4',
            san: 'd4',
            color: 'w',
            branchedHistories: [
              [
                [
                  {
                    isNonMove: true,
                    san: '...',
                    color: 'w',
                  },
                  {
                    from: 'b7',
                    to: 'b5',
                    color: 'b',
                    san: 'b5',
                    branchedHistories: [
                      [
                        [
                          {
                            from: 'b2',
                            to: 'b4',
                            color: 'w',
                            san: 'b4',
                          },
                        ],
                      ],
                    ],
                  },
                ],
              ],
            ],
          },
          {
            from: 'd7',
            to: 'd5',
            san: 'd5',
            color: 'b',
          },
        ],
      ] satisfies FBHHistory;

      expect(actualHistory).toEqual(expected);
      expect(actualIndex).toEqual([0, 0, [[0, 1, [[0, 0]]]]]);
    });

    test('from second nested branch', () => {
      const nestedHistory = [
        [
          {
            from: 'd2',
            to: 'd4',
            san: 'd4',
            color: 'w',
            branchedHistories: [
              [
                [
                  {
                    isNonMove: true,
                    san: '...',
                    color: 'w',
                  },
                  {
                    from: 'b7',
                    to: 'b5',
                    color: 'b',
                    san: 'b5',
                    branchedHistories: [
                      [
                        [
                          {
                            from: 'b2',
                            to: 'b4',
                            color: 'w',
                            san: 'b4',
                          },
                          {
                            from: 'c7',
                            to: 'c6',
                            color: 'b',
                            san: 'c4',
                          },
                        ],
                      ],
                      [
                        [
                          {
                            from: 'b2',
                            to: 'b5',
                            color: 'w',
                            san: 'b5',
                          },
                          {
                            from: 'a7',
                            to: 'a6',
                            color: 'b',
                            san: 'a6',
                          },
                        ],
                        [
                          {
                            from: 'h2',
                            to: 'h5',
                            color: 'w',
                            san: 'h5',
                          },
                        ],
                      ],
                    ],
                  },
                ],
              ],
            ],
          },
          {
            from: 'd7',
            to: 'd5',
            san: 'd5',
            color: 'b',
          },
        ],
      ] satisfies FBHHistory;

      const [actualHistory, actualIndex] = FBH.sliceHistory(nestedHistory, [
        0,
        0,
        [[0, 1, [[1, 0], 1]]],
      ]);

      const expected = [
        [
          {
            from: 'd2',
            to: 'd4',
            san: 'd4',
            color: 'w',
            branchedHistories: [
              [
                [
                  {
                    isNonMove: true,
                    san: '...',
                    color: 'w',
                  },
                  {
                    from: 'b7',
                    to: 'b5',
                    color: 'b',
                    san: 'b5',
                    branchedHistories: [
                      [
                        [
                          {
                            from: 'b2',
                            to: 'b4',
                            color: 'w',
                            san: 'b4',
                          },
                          {
                            from: 'c7',
                            to: 'c6',
                            color: 'b',
                            san: 'c4',
                          },
                        ],
                      ],
                      [
                        [
                          {
                            from: 'b2',
                            to: 'b5',
                            color: 'w',
                            san: 'b5',
                          },
                          {
                            from: 'a7',
                            to: 'a6',
                            color: 'b',
                            san: 'a6',
                          },
                        ],
                      ],
                    ],
                  },
                ],
              ],
            ],
          },
          {
            from: 'd7',
            to: 'd5',
            san: 'd5',
            color: 'b',
          },
        ],
      ] satisfies FBHHistory;

      expect(actualHistory).toEqual(expected);
      expect(actualIndex).toEqual([0, 0, [[0, 1, [[0, 1], 1]]]]);
    });
  });

  test('returns the uppwer generation index when removing first move in nested history', () => {
    const nestedHistory = [
      [
        {
          from: 'd2',
          to: 'd4',
          san: 'd4',
          color: 'w',
        },
        {
          from: 'd7',
          to: 'd5',
          san: 'd5',
          color: 'b',
          branchedHistories: [
            [
              [
                {
                  from: 'b7',
                  to: 'b5',
                  color: 'w',
                  san: 'b5',
                  branchedHistories: [
                    [
                      [
                        {
                          from: 'b2',
                          to: 'b4',
                          color: 'w',
                          san: 'b4',
                        },
                        {
                          from: 'c7',
                          to: 'c6',
                          color: 'b',
                          san: 'c4',
                        },
                      ],
                    ],
                  ],
                },
              ],
            ],
          ],
        },
      ],
    ] satisfies FBHHistory;

    const [actualHistory, actualIndex] = FBH.sliceHistory(nestedHistory, [
      0,
      1,
      [[0, 0, [[0, 0]]]],
    ]);

    const expected = [
      [
        {
          from: 'd2',
          to: 'd4',
          san: 'd4',
          color: 'w',
        },
        {
          from: 'd7',
          to: 'd5',
          san: 'd5',
          color: 'b',
          branchedHistories: [
            [
              [
                {
                  from: 'b7',
                  to: 'b5',
                  color: 'w',
                  san: 'b5',
                },
              ],
            ],
          ],
        },
      ],
    ] satisfies FBHHistory;

    expect(actualHistory).toEqual(expected);
    expect(actualIndex).toEqual([0, 1, [[0, 0]]]);
  });
});

describe('Calculate Linear History', () => {
  test('from first nested branch', () => {
    const nestedHistory = [
      [
        {
          from: 'd2',
          to: 'd4',
          san: 'd4',
          color: 'w',
          branchedHistories: [
            [
              [
                {
                  isNonMove: true,
                  san: '...',
                  color: 'w',
                },
                {
                  from: 'b7',
                  to: 'b5',
                  color: 'b',
                  san: 'b5',
                  branchedHistories: [
                    [
                      [
                        {
                          from: 'b2',
                          to: 'b4',
                          color: 'w',
                          san: 'b4',
                        },
                      ],
                    ],
                  ],
                },
              ],
            ],
          ],
        },
        {
          from: 'd7',
          to: 'd5',
          san: 'd5',
          color: 'b',
        },
      ],
    ] satisfies FBHHistory;

    const actual = FBH.calculateLinearHistoryToIndex(nestedHistory, [
      0,
      0,
      [[0, 1, [[0, 0]]]],
    ]);

    expect(actual).toEqual([
      {
        from: 'd2',
        to: 'd4',
        san: 'd4',
        color: 'w',
      },
      {
        from: 'b7',
        to: 'b5',
        color: 'b',
        san: 'b5',
      },
      {
        from: 'b2',
        to: 'b4',
        color: 'w',
        san: 'b4',
      },
    ]);
  });
});

describe('RemoveTrailingNonMoves', () => {
  test('returns history when no trailing non moves', () => {
    const actual = FBH.removeTrailingNonMoves(HISTORY_WITH_FULL_LAST_TURN);
    expect(actual).toEqual(HISTORY_WITH_FULL_LAST_TURN);
  });

  test('removes non move on last black position', () => {
    const actual = FBH.removeTrailingNonMoves([
      ...HISTORY_WITH_FULL_LAST_TURN,
      [
        {
          from: 'b2',
          to: 'b4',
          color: 'w',
          san: 'b4',
        },
        FBH.getNonMove('b'),
      ],
    ] as FBHHistory);

    expect(actual).toEqual([
      ...HISTORY_WITH_FULL_LAST_TURN,
      [
        {
          from: 'b2',
          to: 'b4',
          color: 'w',
          san: 'b4',
        },
      ],
    ] as FBHHistory);
  });

  test('removes non move on last white position', () => {
    const actual = FBH.removeTrailingNonMoves([
      ...HISTORY_WITH_FULL_LAST_TURN,
      [FBH.getNonMove('w')],
    ] as FBHHistory);

    expect(actual).toEqual(HISTORY_WITH_FULL_LAST_TURN);
  });

  test('removes non moves on last turn (both white and black)', () => {
    const actual = FBH.removeTrailingNonMoves([
      ...HISTORY_WITH_FULL_LAST_TURN,
      [FBH.getNonMove('w'), FBH.getNonMove('b')],
    ] as FBHHistory);

    expect(actual).toEqual(HISTORY_WITH_FULL_LAST_TURN);
  });

  test('removes non moves on many last turns (both white and black) ending in a half turn', () => {
    const actual = FBH.removeTrailingNonMoves([
      ...HISTORY_WITH_FULL_LAST_TURN,
      [FBH.getNonMove('w'), FBH.getNonMove('b')],
      [FBH.getNonMove('w'), FBH.getNonMove('b')],
      [FBH.getNonMove('w')],
    ] as FBHHistory);

    expect(actual).toEqual(HISTORY_WITH_FULL_LAST_TURN);
  });

  test('does not remove a second to last nonmove', () => {
    const history = [
      ...HISTORY_WITH_FULL_LAST_TURN,
      [
        FBH.getNonMove('w'),
        {
          from: 'b7',
          to: 'b6',
          color: 'b',
          san: 'b6',
        },
      ],
    ] as FBHHistory;
    const actual = FBH.removeTrailingNonMoves(history);

    expect(actual).toEqual(history);
  });
});
