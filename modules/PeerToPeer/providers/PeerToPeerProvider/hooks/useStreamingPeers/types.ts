import { StreamingPeer, StreamingPeersMap } from '../../type';

export type StreamingPeersState =
  | {
      ready: false;
    }
  | {
      ready: true;
      streamersMap: StreamingPeersMap;
      inFocus: StreamingPeer;
      reel: StreamingPeer[];
      reelByUserId: Record<StreamingPeer['userId'], number>;
    };
