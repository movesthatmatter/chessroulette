import {
  BRANCHED_HISTORY_1,
  BRANCHED_HISTORY_2,
  BRANCHED_HISTORY_3,
  LONG_HISTORY_WITH_FULL_LAST_TURN,
  LONG_HISTORY_WITH_PARALEL_HISTORIES,
  PARALEL_BRANCHED_HISTORIES,
  HISTORY_WITH_FULL_LAST_TURN,
  HISTORY_WITH_HALF_LAST_TURN,
} from './specUtils';
import {
  FBHIndex,
  FBHHistory,
  FBHRecursiveFullTurn,
  FBHRecursiveHalfTurn,
  FBHBlackMove,
  FBHMove,
} from '../types';
import { FreeBoardHistory as FBH, FreeBoardHistory } from '../FreeBoardHistory';

describe('addMagicMove', () => {
  test('adds a white move at the end of history', () => {
    const history = HISTORY_WITH_FULL_LAST_TURN;

    const newMove: FBHMove = {
      from: 'a2',
      to: 'a3',
      color: 'w',
      san: 'a3',
    };

    const lastIndexInHistory = FBH.getLastIndexInHistory(
      HISTORY_WITH_FULL_LAST_TURN
    );

    const actual = FBH.addMagicMove(
      {
        history,
        atIndex: lastIndexInHistory,
      },
      newMove
    );

    const expectedHistory = [...history, [newMove]];
    const expectedIndex = [1, 0];
    const expected = [expectedHistory, expectedIndex];

    expect(actual).toEqual(expected);
  });

  test('adds a black move at the end of history', () => {
    const newMove: FBHBlackMove = {
      from: 'a7',
      to: 'a6',
      color: 'b',
      san: 'a6',
    };

    const actual = FBH.addMagicMove(
      {
        history: HISTORY_WITH_HALF_LAST_TURN,
        atIndex: FBH.getLastIndexInHistory(HISTORY_WITH_HALF_LAST_TURN),
      },
      newMove
    );

    const expectedHistory = [
      HISTORY_WITH_HALF_LAST_TURN[0],
      [
        {
          from: 'a2',
          to: 'a3',
          color: 'w',
          san: 'a3',
        },
        newMove,
      ],
    ];

    const expectedIndex = [1, 1];
    const expected = [expectedHistory, expectedIndex];

    expect(actual).toEqual(expected);
  });

  describe('Recursivity', () => {
    test('adds a first branched history (Black Move) to a Half turn (White Move)', () => {
      const move: FBHMove = {
        from: 'f7',
        to: 'f6',
        color: 'b',
        san: 'f6',
      };

      const actual = FBH.addMagicMove(
        {
          history: LONG_HISTORY_WITH_FULL_LAST_TURN,
          atIndex: [1, 0],
        },
        move
      );

      const expectedTurn: FBHRecursiveFullTurn = [FBH.getWhiteNonMove(), move];
      const expectedHistory = [
        ...LONG_HISTORY_WITH_FULL_LAST_TURN.slice(0, 1),
        [
          {
            from: 'd2',
            to: 'd4',
            color: 'w',
            san: 'd4',
            branchedHistories: [[expectedTurn]],
          },
          {
            from: 'd7',
            to: 'd5',
            color: 'b',
            san: 'd5',
          },
        ],
        ...LONG_HISTORY_WITH_FULL_LAST_TURN.slice(2),
      ] as FBHHistory;
      const expectedIndex: FBHIndex = [1, 0, [[0, 1], 0]];
      const expected = [expectedHistory, expectedIndex];

      expect(actual).toEqual(expected);
    });

    test('adds a first branched history (white move) to a Full turn (black move)', () => {
      const move: FBHMove = {
        from: 'f2',
        to: 'f3',
        color: 'w',
        san: 'f3',
      };

      const actual = FBH.addMagicMove(
        {
          history: LONG_HISTORY_WITH_FULL_LAST_TURN,
          atIndex: [1, 1],
        },
        move
      );

      const expectedTurn: FBHRecursiveHalfTurn = [move];
      const expectedHistory = [
        ...LONG_HISTORY_WITH_FULL_LAST_TURN.slice(0, 1),
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
            branchedHistories: [[expectedTurn]],
          },
        ],
        ...LONG_HISTORY_WITH_FULL_LAST_TURN.slice(2),
      ] as FBHHistory;
      const expectedIndex: FBHIndex = [1, 1, [[0, 0], 0]];
      const expected = [expectedHistory, expectedIndex];

      expect(actual).toEqual(expected);
    });

    test('adds a continous move to an existent first branched history with FULL TURN', () => {
      const branchedHistory: FBHHistory = BRANCHED_HISTORY_2;
      const historyWithBranches = [
        ...LONG_HISTORY_WITH_FULL_LAST_TURN.slice(0, 1),
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
            branchedHistories: [branchedHistory],
          },
        ],
        ...LONG_HISTORY_WITH_FULL_LAST_TURN.slice(2),
      ] as FBHHistory;

      const move: FBHMove = {
        color: 'w',
        from: 'h2',
        to: 'h3',
        san: 'h2',
      };

      const actual = FBH.addMagicMove(
        {
          history: historyWithBranches,
          atIndex: [1, 1, [[0, 1]]],
        },
        move
      );

      const expectedTurn: FBHRecursiveHalfTurn = [move];
      const expectedHistory = [
        ...LONG_HISTORY_WITH_FULL_LAST_TURN.slice(0, 1),
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
            branchedHistories: [[...branchedHistory, expectedTurn]],
          },
        ],
        ...LONG_HISTORY_WITH_FULL_LAST_TURN.slice(2),
      ] as FBHHistory;
      const expectedIndex: FBHIndex = [1, 1, [[1, 0], 0]];
      const expected = [expectedHistory, expectedIndex];

      expect(actual).toEqual(expected);
    });

    test('adds a continous white move to an existent branch in between paralel histories', () => {
      const move: FBHMove = {
        color: 'w',
        from: 'h2',
        to: 'h3',
        san: 'h2',
      };

      const actual = FBH.addMagicMove(
        {
          history: LONG_HISTORY_WITH_PARALEL_HISTORIES,
          atIndex: [1, 1, [[0, 1], 1]],
        },
        move
      );

      const expectedTurn: FBHRecursiveHalfTurn = [move];
      const expectedHistory = [
        ...LONG_HISTORY_WITH_FULL_LAST_TURN.slice(0, 1),
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
              BRANCHED_HISTORY_1,
              [...BRANCHED_HISTORY_2, expectedTurn],
              BRANCHED_HISTORY_3,
            ],
          },
        ],
        ...LONG_HISTORY_WITH_FULL_LAST_TURN.slice(2),
      ] as FBHHistory;
      const expectedIndex: FBHIndex = [1, 1, [[1, 0], 1]];
      const expected = [expectedHistory, expectedIndex];

      expect(actual).toEqual(expected);
    });

    test('adds a continous black move to an existent branch in a list of paralel histories', () => {
      const move: FBHMove = {
        color: 'b',
        from: 'h7',
        san: 'h7',
        to: 'h5',
      };

      const actual = FBH.addMagicMove(
        {
          history: LONG_HISTORY_WITH_PARALEL_HISTORIES,
          atIndex: [1, 1, [[1, 0], 0]],
        },
        move
      );

      const expectedTurn: FBHRecursiveFullTurn = [
        PARALEL_BRANCHED_HISTORIES[0][1][0],
        move,
      ];
      const expectedHistory = [
        ...LONG_HISTORY_WITH_FULL_LAST_TURN.slice(0, 1),
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
              [...BRANCHED_HISTORY_1.slice(0, 1), expectedTurn],
              BRANCHED_HISTORY_2,
              BRANCHED_HISTORY_3,
            ],
          },
        ],
        ...LONG_HISTORY_WITH_FULL_LAST_TURN.slice(2),
      ] as FBHHistory;
      const expectedIndex: FBHIndex = [1, 1, [[1, 1], 0]];
      const expected = [expectedHistory, expectedIndex];

      expect(actual).toEqual(expected);
    });

    test('starts a parallel branched history', () => {
      const branchedHistory: FBHHistory = BRANCHED_HISTORY_1;
      const historyWithBranches = [
        ...LONG_HISTORY_WITH_FULL_LAST_TURN.slice(0, 1),
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
            branchedHistories: [branchedHistory],
          },
        ],
        ...LONG_HISTORY_WITH_FULL_LAST_TURN.slice(2),
      ] as FBHHistory;

      const move: FBHMove = {
        color: 'w',
        from: 'f2',
        san: 'f2',
        to: 'f4',
      };

      const actual = FBH.addMagicMove(
        {
          history: historyWithBranches,
          atIndex: [1, 1],
        },
        move
      );

      const expectedTurn: FBHRecursiveHalfTurn = [move];
      const expectedNewBranchedHistory: FBHHistory = [expectedTurn];
      const expectedHistory = [
        ...LONG_HISTORY_WITH_FULL_LAST_TURN.slice(0, 1),
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
            branchedHistories: [branchedHistory, expectedNewBranchedHistory],
          },
        ],
        ...LONG_HISTORY_WITH_FULL_LAST_TURN.slice(2),
      ] as FBHHistory;
      const expectedIndex: FBHIndex = [1, 1, [[0, 0], 1]];
      const expected = [expectedHistory, expectedIndex];

      expect(actual).toEqual(expected);
    });

    test('Adds multiple sequential moves to nested branches ', () => {
      const move1: FBHMove = {
        color: 'w',
        from: 'g2',
        to: 'g3',
        san: 'g3:tested-move1',
      };

      // Added black move to branched history
      const afterMove1 = FBH.addMagicMove(
        {
          history: LONG_HISTORY_WITH_PARALEL_HISTORIES,
          atIndex: [1, 1, [[0, 1], 1]],
        },
        move1
      );

      const [addedMove1History, addedMove1AtIndex] = afterMove1;

      const move2: FBHMove = {
        color: 'b',
        from: 'g7',
        to: 'g6',
        san: 'g6:tested-move2',
      };

      const actual = FBH.addMagicMove(
        {
          history: addedMove1History,
          atIndex: addedMove1AtIndex,
        },
        move2
      );

      const expectedHistory = [
        ...LONG_HISTORY_WITH_FULL_LAST_TURN.slice(0, 1),
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
              BRANCHED_HISTORY_1,
              [...BRANCHED_HISTORY_2, [move1, move2]],
              BRANCHED_HISTORY_3,
            ],
          },
        ],
        ...LONG_HISTORY_WITH_FULL_LAST_TURN.slice(2),
      ] as FBHHistory;

      const expectedIndex: FBHIndex = [1, 1, [[1, 1], 1]];
      const expected = [expectedHistory, expectedIndex];

      expect(actual).toEqual(expected);
    });
  });

  test('bug with adding on nested white moves', () => {
    const history: FBHHistory = [
      [
        {
          color: 'w',
          // piece: 'k',
          san: 'Ke2',
          to: 'e2',
          from: 'e1',
          branchedHistories: [
            [
              [
                {
                  color: 'w',
                  san: '...',
                  isNonMove: true,
                },
                {
                  color: 'b',
                  // piece: 'k',
                  san: 'Kd7',
                  to: 'd7',
                  from: 'e8',
                },
              ],
              [
                {
                  color: 'w',
                  // piece: 'k',
                  san: 'Kd3',
                  to: 'd3',
                  from: 'e2',
                },
                {
                  color: 'b',
                  // piece: 'k',
                  san: 'Kd6',
                  to: 'd6',
                  from: 'd7',
                },
              ],
            ],
          ],
        },
        {
          color: 'b',
          // piece: 'k',
          san: 'Ke7',
          to: 'e7',
          from: 'e8',
        },
      ],
    ];

    const focusedIndex: FBHIndex = [0, 0, [[1, 0]]];
    const actual = FBH.addMagicMove(
      {
        history,
        atIndex: focusedIndex,
      },
      { from: 'd7', to: 'e7', color: 'b', san: 'Ke7' }
    );

    const expectedHistory: FBHHistory = [
      [
        {
          color: 'w',
          // piece: 'k',
          san: 'Ke2',
          to: 'e2',
          from: 'e1',
          branchedHistories: [
            [
              [
                {
                  color: 'w',
                  san: '...',
                  isNonMove: true,
                },
                {
                  color: 'b',
                  // piece: 'k',
                  san: 'Kd7',
                  to: 'd7',
                  from: 'e8',
                },
              ],
              [
                {
                  color: 'w',
                  // piece: 'k',
                  san: 'Kd3',
                  to: 'd3',
                  from: 'e2',
                  branchedHistories: [
                    [
                      [
                        // {  },
                        {
                          isNonMove: true,
                          color: 'w',
                          san: '...',
                          from: undefined,
                          to: undefined,
                        },
                        { from: 'd7', to: 'e7', color: 'b', san: 'Ke7' },
                      ],
                    ],
                  ],
                },
                {
                  color: 'b',
                  // piece: 'k',
                  san: 'Kd6',
                  to: 'd6',
                  from: 'd7',
                },
              ],
            ],
          ],
        },
        {
          color: 'b',
          // piece: 'k',
          san: 'Ke7',
          to: 'e7',
          from: 'e8',
        },
      ],
    ];

    const expectedIndex: FBHIndex = [0, 0, [[1, 0, [[0, 1], 0]], 0]];

    expect(actual).toEqual([expectedHistory, expectedIndex]);
  });
});

describe('Same color moves', () => {
  describe('linear history', () => {
    test('white moves in a row 1 time from the start', () => {
      const history: FBHHistory = [
        [
          {
            color: 'w',
            san: 'Ke7',
            to: 'e7',
            from: 'e8',
          },
        ],
      ];

      const nextMove: FBHMove = {
        color: 'w',
        san: 'Ke7',
        to: 'e8',
        from: 'f7',
      };
      const actual = FBH.addMagicMove(
        {
          history,
          atIndex: [0, 0],
        },
        nextMove
      );

      const expectedMove = [
        [...history[0], FBH.getNonMove('b')],
        [nextMove],
      ];

      expect(actual).toEqual([expectedMove, [1, 0]]);
    });
  });
});
