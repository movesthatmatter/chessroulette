import { UCI_Commands } from './types';

type UnsubscribeFn = () => void;

export interface UciEmitter {
  cmd: (cmd: UCI_Commands, payload?: string) => void;
  onMsg: (fn: (msg: string) => void) => UnsubscribeFn;
}
