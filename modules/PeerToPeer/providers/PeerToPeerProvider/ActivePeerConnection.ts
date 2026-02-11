import { type DataConnection } from 'peerjs';
import { Pubsy } from 'ts-pubsy';
import { Err } from 'ts-results';
import { logsy } from '@/lib/Logsy';
import { eitherToResult } from '@/lib/util';
import { PeerUserId } from './type';
import { peerMessageEnvelope, PeerMessageEnvelope } from './records';
import { getAVStreamingInstance } from '../../services/AVStreaming';

type Events = {
  onOpen: undefined;
  onClose: undefined;
  onStream: MediaStream;
  onMessage: PeerMessageEnvelope;
  onError: unknown;
};

export class ActivePeerConnection {
  private pubsy = new Pubsy<Events>();

  private avStreamingInstance = getAVStreamingInstance();

  private myStream?: MediaStream;

  private unsubscribers: Partial<Record<keyof Events, () => void>> = {};

  constructor(
    public peerUserId: PeerUserId,
    private connection: DataConnection
  ) {
    // On Open Event
    const onOpenHandler = () => {
      logsy.info(
        '[ActivePeerConnection] with Peer:',
        peerUserId,
        'Connection Opened.'
      );
      this.pubsy.publish('onOpen', undefined);
    };

    connection.on('open', onOpenHandler);

    this.unsubscribers.onOpen = () => connection.off('open', onOpenHandler);

    // On Error Event
    const onErrorHandler = (e: unknown) => {
      logsy.error('[ActivePeerConnection] with Peer:', peerUserId, 'Error:', e);

      this.pubsy.publish('onError', e);
    };

    connection.on('error', onErrorHandler);

    this.unsubscribers.onError = () => connection.off('error', onErrorHandler);

    // On Data Event
    const onDataHandler = (data: unknown) => {
      if (typeof data !== 'string') {
        logsy.error(
          '[ActivePeerConnection] with Peer:',
          peerUserId,
          'OnMessageHandler Decoding Error',
          data
        );
        return new Err('Given Data is not a string');
      }

      eitherToResult(peerMessageEnvelope.decode(JSON.parse(data)))
        .map((msg) => {
          this.pubsy.publish('onMessage', msg);
        })
        .mapErr(() => {
          logsy.error(
            '[ActivePeerConnection] with Peer:',
            peerUserId,
            'OnMessageHandler Decoding Error',
            data
          );
        });
    };

    connection.on('data', onDataHandler);

    this.unsubscribers.onMessage = () => connection.off('data', onDataHandler);

    // On Close Event
    const onCloseHandler = () => {
      logsy.info(
        '[ActivePeerConnection] with Peer:',
        peerUserId,
        'Connection Closed.'
      );

      this.removeMyStream();

      this.pubsy.publish('onClose', undefined);
    };

    connection.on('close', onCloseHandler);

    this.unsubscribers.onClose = () => connection.off('close', onCloseHandler);
  }

  async getMyStream() {
    return this.avStreamingInstance.getStream().then((stream) => {
      this.myStream = stream;

      return stream;
    });
  }

  private removeMyStream() {
    if (this.myStream) {
      this.avStreamingInstance.destroyStreamById(this.myStream.id);
      this.myStream = undefined;
    }
  }

  sendMessage(msg: PeerMessageEnvelope) {
    this.connection.dataChannel.send(JSON.stringify(msg));
  }

  onOpen(fn: () => void) {
    return this.pubsy.subscribe('onOpen', fn);
  }

  onClose(fn: () => void) {
    return this.pubsy.subscribe('onClose', fn);
  }

  onStream(fn: (s: MediaStream) => void) {
    return this.pubsy.subscribe('onStream', fn);
  }

  onMessage(fn: (msg: PeerMessageEnvelope) => void) {
    return this.pubsy.subscribe('onMessage', fn);
  }

  onError(fn: (e: unknown) => void) {
    return this.pubsy.subscribe('onError', fn);
  }

  destroy() {
    this.connection.close();

    Object.values(this.unsubscribers).forEach((unsubscribe) => {
      if (unsubscribe) {
        unsubscribe();
      }
    });

    logsy.info(
      '[ActivePeerConnection] with Peer:',
      this.peerUserId,
      'Destroyed.'
    );
  }
}
