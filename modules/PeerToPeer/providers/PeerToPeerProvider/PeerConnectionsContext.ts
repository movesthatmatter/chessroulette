import { createContext } from 'react';
import { PeerConnections } from './PeerConnections';
import { PeerUserIdsMap } from './type';

export type PeerConnectionsContextState =
  | {
      ready: false;
    }
  | {
      ready: true;
      client: PeerConnections;
      connectToPeers: (peerUserIdsMap: PeerUserIdsMap) => void;
      disconnectFromAllPeers: () => void;
      connectionAttempted: boolean;
    };

export const PeerConnectionsContext =
  createContext<PeerConnectionsContextState>({
    ready: false,
  });
