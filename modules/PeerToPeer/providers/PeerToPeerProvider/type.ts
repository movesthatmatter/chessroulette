export type PeerUserId = string;

export type PeerUserRecord = {
  userId: PeerUserId;
  userDisplayName?: string;
};

export type IceServerRecord = {
  url: string;
  urls: string;
  credential?: string;
  username?: string;
};

export type IceServerResponse = IceServerRecord[];

export type PeerCommunicationType = 'none' | 'audioOnly' | 'audioVideo';

export type PeerStreamingConfigOn = {
  on: true;
  type: 'audio' | 'video' | 'audio-video';
  stream: MediaStream;
};

export type PeerStreamingConfigOff = {
  on: false;
};

export type PeerStreamingConfig =
  | PeerStreamingConfigOn
  | PeerStreamingConfigOff;

export type Peer = PeerUserRecord & {
  connection: PeerStreamingConnection;
};

export type PeerStreamingConnection = {
  channels: {
    data: {
      on: boolean;
    };
    streaming: PeerStreamingConfig;
  };
};

export type PeersMap = Record<Peer['userId'], Peer>;
export type PeerUserIdsMap = Record<Peer['userId'], Peer['userId']>;
export type PeerUsersMap = Record<Peer['userId'], PeerUserRecord>;

export type StreamingPeer = Peer & { connection: PeerStreamingConnectionOn };

export type PeerStreamingConnectionOn = Peer['connection'] & {
  channels: Peer['connection']['channels'] & {
    streaming: PeerStreamingConfigOn;
  };
};

export type StreamingPeersMap = Record<StreamingPeer['userId'], StreamingPeer>;

// TODO: Does it make sense to have the Peer = StreamingPeer | NonStreamingPeer ? hmm
// Probably yeah because then a non StreamingPeer doesn't even need a connection

export const isStreamingPeer = (p: Peer): p is StreamingPeer =>
  p.connection.channels.streaming.on === true;
