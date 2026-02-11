import React, { useCallback, useEffect } from 'react';
import { useWillUnmount } from '@/hooks/useWillUnmount';

import {
  PeerCommunicationType,
  PeerUsersMap,
  usePeerToPeerConnections,
} from '../providers/PeerToPeerProvider';
import { peerUsersMapToPeerIdsMap } from './util';

type Props = React.PropsWithChildren<{
  id: string;
  peerCommunicationType: PeerCommunicationType;
  peerUsersMap: PeerUsersMap;
}>;

export const PeersConnection = (props: Props) => {
  const p2pConnections = usePeerToPeerConnections();

  // Once joined connect to all the peers in the room
  const connectToAllPeersInRoom = useCallback(() => {
    if (p2pConnections.ready && props.peerCommunicationType === 'audioVideo') {
      p2pConnections.connectToPeers(
        peerUsersMapToPeerIdsMap(props.peerUsersMap)
      );
    }
    // TODO: Does this need to depend on the props.peerUsersMap and p2pCommunicationType
  }, [p2pConnections.ready, props.id]);

  const disconnectFromAllPeersInRoom = useCallback(() => {
    if (p2pConnections.ready) {
      p2pConnections.disconnectFromAllPeers();
    }
  }, [p2pConnections.ready]);

  // Connect to the Room on Mount
  useEffect(connectToAllPeersInRoom, [connectToAllPeersInRoom]);

  // This is very important as the room needs to be updated with the
  useWillUnmount(disconnectFromAllPeersInRoom, [disconnectFromAllPeersInRoom]);

  return props.children;
};
