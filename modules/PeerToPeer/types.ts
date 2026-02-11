import { StreamingPeer } from './providers/PeerToPeerProvider';

export type ReelState = {
  streamingPeers: StreamingPeer[];
  myStreamingPeerUserId: StreamingPeer['userId'];
  focusedStreamingPeer: Pick<
    StreamingPeer,
    'connection' | 'userId' | 'userDisplayName'
  >;
};
