import { createContext } from 'react';
import { noop } from '@/lib/misc';
import { UserId, UsersMap } from '@/modules/User';
import { Game, GameDisplayState, GameOffer } from '../types';
import { initialPlayState } from '@/modules/Match/Play/store';
import { ChessColor } from '@/lib/ChessRouler';
import { FBHIndex, FreeBoardHistory } from '@/lib/FreeBoardHistory';

export type GameContextProps = {
  displayState: GameDisplayState;
  committedState: {
    turn: ChessColor;
    game: Game;
  };
  actions: {
    onRefocus: (i: FBHIndex) => void;
  };
  players?: UsersMap;
  playerId?: UserId;
  lastOffer?: GameOffer;
};

export const initialGameContextState: GameContextProps = {
  displayState: {
    fen: '',
    history: [],
    focusedIndex: FreeBoardHistory.getStartingIndex(),
    turn: 'w',
  },
  committedState: {
    turn: 'w',
    game: initialPlayState,
  },
  actions: {
    onRefocus: noop,
  },

  // TODO: Add other stuff in here
  players: undefined,
  playerId: undefined,
  lastOffer: undefined,
};

export const GameContext = createContext<GameContextProps>(
  initialGameContextState,
);
