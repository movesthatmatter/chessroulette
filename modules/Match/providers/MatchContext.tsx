import { createContext } from 'react';
import { MatchViewState } from '../types';
import { MatchActions } from '../movex';
import { MovexDispatchAction } from 'movex';
import { noop } from '@/lib/misc';

export type MatchContextType = MatchViewState & {
  dispatch: MovexDispatchAction<MatchActions>;
};

export const MatchStateContext = createContext<MatchContextType>({
  match: null,
  userAsPlayer: undefined,
  endedGamesCount: 0,
  currentRound: 1,
  previousGame: undefined,
  drawsCount: 0,
  results: {
    challengee: {
      points: 0,
    },
    challenger: {
      points: 0,
    },
  },
  dispatch: noop,

  // deprecate
  // results: {
  //   black: 0,
  //   white: 0,
  // },
});
