import {
  Peer,
  PeersMap,
  StreamingPeer,
  StreamingPeersMap,
} from 'apps/chessroulette-web/providers/PeerToPeerProvider/type';
import { useMemo } from 'react';
import { Reel } from 'apps/chessroulette-web/components/FaceTime/MultiFaceTimeCompact';

type Props = {
  peersMap: PeersMap;
  clientUserId: Peer['userId'];
  focusedUserId?: Peer['userId'];
};

export const isStreamingPeer = (p: Peer): p is StreamingPeer =>
  p.connection.channels.streaming.on === true;

export const useReel = ({
  peersMap,
  clientUserId,
  focusedUserId,
}: Props): Reel | undefined => {
  const peersMapValues = Object.values(peersMap);

  const streamersMap = useMemo(
    () =>
      peersMapValues.reduce((prev, next) => {
        if (!isStreamingPeer(next)) {
          return prev;
        }

        return {
          ...prev,
          [next.userId]: next,
        };
      }, {} as StreamingPeersMap),
    [peersMap]
  );

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
