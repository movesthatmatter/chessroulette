import { useContext } from 'react';
import { PeerStreamingContext } from '../PeerStreamingContext';

export const usePeerStreaming = () => useContext(PeerStreamingContext);
