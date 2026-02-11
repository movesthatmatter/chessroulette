import { Action } from 'movex-core-util';
import {
  Peer,
  PeerUserRecord,
  PeersMap,
  PeerUsersMap,
} from '../providers/PeerToPeerProvider';

export type PeerStreamingState = {
  peers: PeersMap;
};

export type PeerStreamingActions =
  | Action<
      'updatePeerConnection',
      {
        peerUserId: Peer['userId'];
        channels: Partial<Peer['connection']['channels']>;
      }
    >
  | Action<'updatePeers', { peerUsersMap: PeerUsersMap }>;

export const initialPeerStreamingState: PeerStreamingState = {
  peers: {},
};

const peerRecordToPeer = (peer: PeerUserRecord): Peer => {
  return {
    ...peer,
    connection: {
      // This shouldn't be so
      // there's no connetion with myself :)
      channels: {
        data: { on: true },
        streaming: { on: false },
      },
    },
  };
};

export const peerStreamingReducer = (
  state = initialPeerStreamingState,
  action: PeerStreamingActions
) => {
  if (action.type === 'updatePeers') {
    return {
      peers: Object.values(action.payload.peerUsersMap)
        .map((peerUser) => {
          // If already present use it
          if (state.peers[peerUser.userId]) {
            return state.peers[peerUser.userId];
          }

          // Otherwise add the new one
          return peerRecordToPeer(peerUser);
        })
        .reduce(
          (prev, next) => ({
            ...prev,
            [next.userId]: next,
          }),
          {} as PeersMap
        ),
    };
  }

  if (action.type === 'updatePeerConnection') {
    if (!state.peers[action.payload.peerUserId]) {
      return state;
    }

    const nextPeer: Peer = {
      ...state.peers[action.payload.peerUserId],
      connection: {
        ...state.peers[action.payload.peerUserId].connection,
        channels: {
          ...state.peers[action.payload.peerUserId].connection.channels,
          ...action.payload.channels,
        },
      },
    };

    return {
      peers: {
        ...state.peers,
        [nextPeer.userId]: nextPeer,
      },
    };
  }

  return state;
};
