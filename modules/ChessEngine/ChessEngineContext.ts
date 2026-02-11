import { createContext } from 'react';
import { InitiatedChessEngineClient } from './lib/ChessEngineClient';

export type ChessEngineContextState =
  | {
      ready: false;
      client: undefined;
    }
  | {
      ready: true;
      client: InitiatedChessEngineClient;
    };

export const ChessEngineContext = createContext<ChessEngineContextState>({
  ready: false,
  client: undefined,
});
