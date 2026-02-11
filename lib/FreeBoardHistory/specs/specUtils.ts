import { FBHHistory } from '../types';

export const HISTORY_WITH_FULL_LAST_TURN: FBHHistory = [
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
];
export const HISTORY_WITH_HALF_LAST_TURN: FBHHistory = [
  ...HISTORY_WITH_FULL_LAST_TURN,
  [
    {
      from: 'a2',
      to: 'a3',
      color: 'w',
      san: 'a3',
    },
  ],
];

export const LONG_HISTORY_WITH_FULL_LAST_TURN: FBHHistory = [
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
  [
    {
      from: 'a2',
      to: 'a3',
      color: 'w',
      san: 'a3',
    },
    {
      from: 'b7',
      to: 'b5',
      color: 'b',
      san: 'b7',
    },
  ],
];

export const LONG_HISTORY_WITH_HALF_LAST_TURN: FBHHistory = [
  ...LONG_HISTORY_WITH_FULL_LAST_TURN,
  [
    {
      from: 'h2',
      to: 'h3',
      color: 'w',
      san: 'h3',
    },
  ],
];

export const BRANCHED_HISTORY_1: FBHHistory = [
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
];
export const BRANCHED_HISTORY_2: FBHHistory = [
  [
    {
      from: 'h2',
      to: 'h4',
      color: 'w',
      san: 'h4',
    },
    {
      from: 'h7',
      to: 'h5',
      color: 'b',
      san: 'h5',
    },
  ],
];
export const BRANCHED_HISTORY_3: FBHHistory = [
  [
    {
      from: 'c2',
      to: 'c4',
      color: 'w',
      san: 'c4',
    },
  ],
];
export const PARALEL_BRANCHED_HISTORIES = [
  BRANCHED_HISTORY_1,
  BRANCHED_HISTORY_2,
  BRANCHED_HISTORY_3,
];
export const LONG_HISTORY_WITH_PARALEL_HISTORIES = [
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
      branchedHistories: PARALEL_BRANCHED_HISTORIES,
    },
  ],
  ...LONG_HISTORY_WITH_FULL_LAST_TURN.slice(2),
] as FBHHistory;
