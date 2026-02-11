import { ChessFEN } from '@/lib/ChessRouler';
import { REGEX } from './constants';
import { InfoLine } from './io';

export type { InfoLine } from './io';

/**
 * Inspired from https://gist.github.com/DOBRO/2592c6dad754ba67e6dcaec8c90165bf#file-uci-protocol-specification-txt
 */
export type UCI_Commands =
  | 'uci'
  | 'ucinewgame'
  | 'isready'
  | 'position'
  | 'quit'
  | 'go'
  | 'stop'
  | 'ponderhit';

export type BestMoveUCIResponse = {
  // bestmove: ChessMove;
  // ponder?: ChessMove;
  bestmove: string;
  ponder?: string;
};
export type EvaluatedInfoLine = InfoLine & {
  evaluation: {
    heightsPct: {
      w: number;
      b: number;
    };
    evalAsStr: string;
  };
};

export type IdUCIResponse = {
  name: string;
  author: string;
};

export type OptionUCIResponse = {
  type: string;
  default?: boolean | number | string;
  options?: string[];
  min?: number;
  max?: number;
};

export type UCIResponsesMap = {
  id: string;
  uciok: undefined;
  readyok: undefined;
  option: OptionUCIResponse;
  bestmove: BestMoveUCIResponse;
  info: Partial<Record<keyof typeof REGEX.info, any>>; //TODO Fix
  registration: unknown;
};

export type EngineResultState = {
  canSearch: boolean;
  id?: IdUCIResponse;
  bestMove?: string;
  bestLine?: EvaluatedInfoLine;
  fen: ChessFEN;
};
