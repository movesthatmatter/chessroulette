import { UciEmitter } from './UciEmitter';
import { UCI_Commands } from './types';

export class WebSocketToUciEmitter implements UciEmitter {
  constructor(
    private emitter: {
      send: (msg: string) => void;
      addEventListener<K extends keyof WebSocketEventMap>(
        type: K,
        listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions
      ): void;
      removeEventListener<K extends keyof WebSocketEventMap>(
        type: K,
        listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any,
        options?: boolean | EventListenerOptions
      ): void;
    }
  ) {}

  // TODO: This could be typed to UCI Commands but for now is OK
  cmd(cmd: UCI_Commands, payload?: string) {
    this.emitter.send(cmd + (payload ? ` ${payload}` : ''));
  }

  onMsg(fn: (response: string) => void) {
    const handler = (event: WebSocketEventMap['message']) => fn(event.data);

    this.emitter.addEventListener('message', handler);

    return () => {
      this.emitter.removeEventListener('message', handler);
    };
  }
}
