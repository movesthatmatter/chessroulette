import { createContext } from 'react';
import { ReelState } from '../types';
import { PeerCommunicationType } from '../publicTypes';
import { noop } from '@/lib/misc';

export type PeerStreamingContextState = {
  peerCommunicationType: PeerCommunicationType;
  clientUserId: string;
  reel?: ReelState;
  updateCommunicationType: (type: PeerCommunicationType) => void;
};

export const PeerStreamingContext = createContext<PeerStreamingContextState>({
  peerCommunicationType: 'none',
  reel: undefined,
  clientUserId: '',
  updateCommunicationType: noop,
});
