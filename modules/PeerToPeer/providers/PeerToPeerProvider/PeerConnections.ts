import { Pubsy } from 'ts-pubsy';
import type { DataConnection, MediaConnection } from 'peerjs';
import PeerSDK from 'peerjs';
import { wNamespace, woNamespace } from './util';
import { ActivePeerConnection } from './ActivePeerConnection';
import { IceServerRecord, PeerUserId } from './type';
import { logsy } from '@/lib/Logsy';
import { config } from '@/config';

export type PeerConnectionsErrors = 'PEER_ID_TAKEN' | 'GENERIC_ERROR';

export class PeerConnections {
  // This is the Client User using the App, needed here to check it against the peers
  private clientUserId: string;

  private pubsy = new Pubsy<{
    onOpen: void;
    onClose: void;
    onPeerConnected: PeerUserId;
    onPeerDisconnected: PeerUserId;
    onError: PeerConnectionsErrors;
    onPeerStream: {
      peerUserId: PeerUserId;
      stream: MediaStream;
    };
  }>();

  private sdk: PeerSDK;

  connections: Record<PeerUserId, ActivePeerConnection> = {};

  unsubscribers: (() => void)[] = [];

  constructor({
    clientUserId,
    iceServers,
  }: {
    clientUserId: string;
    iceServers: IceServerRecord[];
  }) {
    this.clientUserId = clientUserId;
    this.sdk = new PeerSDK(wNamespace(clientUserId), {
      ...config.SIGNALING_SERVER_CONFIG,
      config: {
        iceServers,
      },
    });

    // On Error Event
    const onErrorHandler = (e: unknown) => {
      // The pattern matching is not the safest since it depends on runtime strings
      //  rather than a type but it's the best we can do atm.
      // TOOD: Need to keep an eye as the library might change it without noticing!
      // TODO: A test should be added around this!
      if (e instanceof Error && e.message.match(/ID "\w+" is taken/g)) {
        this.pubsy.publish('onError', 'PEER_ID_TAKEN');
      } else {
        this.pubsy.publish('onError', 'GENERIC_ERROR');
      }
    };
    this.sdk.on('error', onErrorHandler);

    this.unsubscribers.push(() => this.sdk.off('error', onErrorHandler));

    // On Open Event
    const onOpenHandler = (id: string) => {
      this.pubsy.publish('onOpen', undefined);
    };
    this.sdk.on('open', onOpenHandler);
    this.unsubscribers.push(() => this.sdk.off('open', onOpenHandler));

    // On Connection Event
    const onConnectionHandler = (pc: DataConnection) => {
      const peerUserId = woNamespace(pc.peer);

      this.connections[peerUserId] = new ActivePeerConnection(peerUserId, pc);

      const unsubscribeFromApcOnClose = this.connections[peerUserId].onClose(
        () => {
          this.removePeerConnection(peerUserId);

          this.pubsy.publish('onPeerDisconnected', peerUserId);
        }
      );
      this.unsubscribers.push(unsubscribeFromApcOnClose);

      this.pubsy.publish('onPeerConnected', peerUserId);
    };
    this.sdk.on('connection', onConnectionHandler);
    this.unsubscribers.push(() =>
      this.sdk.off('connection', onConnectionHandler)
    );

    // On Call Event
    const onCallHandler = (call: MediaConnection) => {
      const peerUserId = woNamespace(call.peer);
      const apc = this.connections[peerUserId];

      if (!apc) {
        // This shouldn't happen
        return;
      }

      apc.getMyStream().then((myStream) => {
        call.answer(myStream);
        call.on('stream', (stream) => {
          // console.log('on call handler stream tracks', stream.getTracks());

          this.pubsy.publish('onPeerStream', {
            peerUserId,
            stream,
          });
        });
      });
    };
    this.sdk.on('call', onCallHandler);
    this.unsubscribers.push(() => {
      this.sdk.off('call', onCallHandler);
    });

    // On Close Event
    const onCloseHandler = () => {
      logsy.info('[PeerConnections] PeerSDK Closed.');
      this.pubsy.publish('onClose', undefined);
    };
    this.sdk.on('close', onCloseHandler);
    this.unsubscribers.push(() => this.sdk.off('close', onCloseHandler));

    // On Disconnected Event
    const onDisconnectedHandler = () => {
      logsy.info('[PeerConnections] PeerSDK Disconnected.');
    };
    this.sdk.on('disconnected', onDisconnectedHandler);
    this.unsubscribers.push(() =>
      this.sdk.off('disconnected', onDisconnectedHandler)
    );
  }

  onOpen(fn: () => void) {
    return this.pubsy.subscribe('onOpen', fn);
  }

  onClose(fn: () => void) {
    return this.pubsy.subscribe('onClose', fn);
  }

  onPeerConnected(fn: (peerId: PeerUserId) => void) {
    return this.pubsy.subscribe('onPeerConnected', fn);
  }

  onPeerDisconnected(fn: (peerId: PeerUserId) => void) {
    return this.pubsy.subscribe('onPeerDisconnected', fn);
  }

  onPeerStream(
    fn: (props: { peerUserId: PeerUserId; stream: MediaStream }) => void
  ) {
    return this.pubsy.subscribe('onPeerStream', fn);
  }

  onError(fn: (e: PeerConnectionsErrors) => void) {
    return this.pubsy.subscribe('onError', fn);
  }

  connect(peerUserIds: Record<PeerUserId, PeerUserId>) {
    const peersWithoutMe = Object.values(peerUserIds)
      // Ensure myPeer is excluded
      .filter((peerUserId) => peerUserId !== this.clientUserId);

    const allAPCUnsubscribers = peersWithoutMe.map((peerUserId) => {
      const namespacedPeerId = wNamespace(peerUserId);

      const apc = new ActivePeerConnection(
        peerUserId,
        this.sdk.connect(namespacedPeerId)
      );

      let onStreamUnsubscriber = () => {};
      const onOpenUnsubscriber = apc.onOpen(() => {
        apc.getMyStream().then((stream) => {
          const call = this.sdk.call(namespacedPeerId, stream);

          const onStreamHandler = (stream: MediaStream) => {
            this.pubsy.publish('onPeerStream', {
              peerUserId: peerUserId,
              stream,
            });
          };

          call.on('stream', onStreamHandler);

          onStreamUnsubscriber = () => {
            call.off('stream', onStreamHandler);
          };
        });

        this.pubsy.publish('onPeerConnected', peerUserId);
      });

      const onCloseUnsubscriber = apc.onClose(() => {
        this.removePeerConnection(peerUserId);

        this.pubsy.publish('onPeerDisconnected', peerUserId);
      });

      this.connections[peerUserId] = apc;

      return () => {
        // Put all the unsubscribers here
        onStreamUnsubscriber();
        onOpenUnsubscriber();
        onCloseUnsubscriber();
      };
    });

    this.unsubscribers.push(() => {
      allAPCUnsubscribers.forEach((unsubscribe) => {
        unsubscribe();
      });
    });
  }

  removePeerConnection(peerUserId: PeerUserId) {
    const { [peerUserId]: apc, ...restConnections } = this.connections;

    if (apc) {
      apc.destroy();

      this.connections = restConnections;
    }
  }

  /**
   * Closes own connection to PeerSDK Server
   */
  close() {
    // Remove all the PeerSDK listeners
    this.unsubscribers.forEach((unsubscribe) => {
      unsubscribe();
    });

    this.unsubscribers = [];

    this.sdk.disconnect();
    this.sdk.destroy();

    logsy.info('[PeerConnections] Closed.');
  }

  /**
   * Destroys all the APCs
   */
  disconnect() {
    Object.values(this.connections).forEach((apc) => {
      apc.destroy();
    });

    this.connections = {};

    logsy.info('[PeerConnections] Disconnected.');
  }

  destroy() {
    this.disconnect();

    this.close();

    logsy.info('[PeerConnections] Destroyed!');
  }
}
