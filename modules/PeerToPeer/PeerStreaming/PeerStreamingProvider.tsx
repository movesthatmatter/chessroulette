import React, {
  PropsWithChildren,
  useEffect,
  useReducer,
  useState,
} from 'react';
import { config } from '@/config';
import { type UserId } from '@/modules/User';
import { initialPeerStreamingState, peerStreamingReducer } from './reducer';
import {
  IceServerRecord,
  PeerCommunicationType,
  PeerToPeerProvider,
  PeerUsersMap,
} from '../providers/PeerToPeerProvider';
import {
  PeerStreamingContext,
  PeerStreamingContextState,
} from './PeerStreamingContext';
import { PeersConnection } from './PeerConnection';
import { constructReel } from './util';

type Props = PropsWithChildren<{
  groupId: string;
  clientUserId: UserId;
  peerUsersMap: PeerUsersMap; // This excludes the Local Client Peer (Me)
  iceServers: IceServerRecord[];
  peerCommunicationType?: PeerCommunicationType;
}>;

export const PeerStreamingProvider: React.FC<Props> = ({
  peerCommunicationType = 'audioVideo',
  clientUserId,
  ...props
}) => {
  const [state, dispatch] = useReducer(
    peerStreamingReducer,
    initialPeerStreamingState
  );

  const [contextState, setContextState] = useState<PeerStreamingContextState>({
    clientUserId,
    reel: constructReel({
      peersMap: state.peers,
      clientUserId,
    }),
    peerCommunicationType,
    updateCommunicationType: (type: PeerCommunicationType) => {
      setContextState((prev) => ({
        ...prev,
        peerCommunicationType: type,
      }));
    },

  });

  useEffect(() => {
    dispatch({
      type: 'updatePeers',
      payload: {
        peerUsersMap: props.peerUsersMap,
      },
    });
  }, [props.peerUsersMap, dispatch]);

  useEffect(() => {
    setContextState((prev) => ({
      ...prev,
      reel: constructReel({
        peersMap: state.peers,
        clientUserId,
      }),
    }));
  }, [state.peers, clientUserId]);

  return (
    <PeerStreamingContext.Provider value={contextState}>
      {config.CAMERA_ON ? (
        <PeerToPeerProvider
          clientUserId={clientUserId}
          iceServers={props.iceServers}
          uniqId={props.groupId}
          onPeerConnectionChannelsUpdated={(payload) => {
            dispatch({ type: 'updatePeerConnection', payload });
          }}
        >
          <PeersConnection
            id={props.groupId}
            peerCommunicationType={contextState.peerCommunicationType}
            peerUsersMap={props.peerUsersMap}
          >
            {props.children}
          </PeersConnection>
        </PeerToPeerProvider>
      ) : (
        props.children
      )}
    </PeerStreamingContext.Provider>
  );
};
