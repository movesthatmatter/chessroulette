import React, { useEffect, useState } from 'react';
import {
  ChessEngineContext,
  ChessEngineContextState,
} from './ChessEngineContext';
import { ChessEngineClient } from './lib/ChessEngineClient';
import { UnsubscribeFn } from 'movex-core-util';
import { invoke } from '@/lib/misc';
import { WebSocketToUciEmitter } from './lib/WebSocketToUciEmitter';

type Props = React.PropsWithChildren & {
  uciUrl: string;
};

export const ChessEngineProvider = React.memo((props: Props) => {
  const [contextState, setContextState] = useState<ChessEngineContextState>({
    ready: false,
    client: undefined,
  });

  useEffect(() => {
    const unsubscribers: UnsubscribeFn[] = [];
    const ws = new WebSocket(props.uciUrl);

    ws.onopen = async () => {
      console.log('[ChessEngineProvider] UCI Connection Opened');

      const engineClient = new ChessEngineClient(new WebSocketToUciEmitter(ws));

      setContextState({
        ready: true,
        client: await engineClient.init(),
      });
    };

    ws.onclose = () => {
      console.log('[ChessEngineProvider] UCI Connection Closed');

      // Destroy the preexisting Client before closing
      contextState.client?.destroy();

      setContextState({
        ready: false,
        client: undefined,
      });
    };

    return () => {
      ws.close();
      unsubscribers.forEach(invoke);
    };
  }, []);

  return (
    <ChessEngineContext.Provider value={contextState}>
      {props.children}
    </ChessEngineContext.Provider>
  );
});
