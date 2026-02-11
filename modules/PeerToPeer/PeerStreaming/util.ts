import { objectKeys, toDictIndexedBy } from '@/lib/misc';
import {
  Peer,
  PeerUserIdsMap,
  PeerUsersMap,
  PeersMap,
  StreamingPeer,
  StreamingPeersMap,
} from '../providers/PeerToPeerProvider';
import { ReelState } from '../types';

export const peerUsersMapToPeerIdsMap = (pm: PeerUsersMap): PeerUserIdsMap =>
  toDictIndexedBy(objectKeys(pm), (id) => id);

export const constructReel = ({
  peersMap,
  clientUserId,
  focusedUserId,
}: {
  peersMap: PeersMap;
  clientUserId: Peer['userId'];
  focusedUserId?: Peer['userId'];
}): ReelState | undefined => {
  const peersMapValues = Object.values(peersMap);

  const streamersMap = peersMapValues.reduce((prev, next) => {
    if (!isStreamingPeer(next)) {
      return prev;
    }

    return {
      ...prev,
      [next.userId]: next,
    };
  }, {} as StreamingPeersMap);

  const focusedStreamingPeer =
    (focusedUserId && streamersMap[focusedUserId]) ||
    Object.values(streamersMap)[0];

  const { [focusedStreamingPeer?.userId]: removed, ...streamersMapSinFocused } =
    streamersMap;

  const streamersSinFocusedList = Object.values(streamersMapSinFocused);

  if (!focusedStreamingPeer) {
    return undefined;
  }

  return {
    streamingPeers: streamersSinFocusedList,
    focusedStreamingPeer: focusedStreamingPeer,
    myStreamingPeerUserId: clientUserId,
  };
};

const isStreamingPeer = (p: Peer): p is StreamingPeer =>
  p.connection.channels.streaming.on === true;
