import { useContext } from 'react';
import { PeerConnectionsContext } from '../PeerConnectionsContext';

export const usePeerToPeerConnections = () => useContext(PeerConnectionsContext);
