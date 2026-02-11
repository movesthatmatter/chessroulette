'use client';

import { Component } from 'react';
import { type PeerConnections } from './PeerConnections';
import { IceServerRecord } from './type';
import { invoke } from '@/lib/misc';

export type PeerConnectionsStateProps = {
  iceServers: IceServerRecord[];
  clientUserId: string;

  onOpen?: Parameters<PeerConnections['onOpen']>[0];
  onClose?: Parameters<PeerConnections['onClose']>[0];
  onPeerConnected?: Parameters<PeerConnections['onPeerConnected']>[0];
  onPeerDisconnected?: Parameters<PeerConnections['onPeerDisconnected']>[0];
  onPeerStream?: Parameters<PeerConnections['onPeerStream']>[0];
  onError?: Parameters<PeerConnections['onError']>[0];

  onStateUpdate?: (pcsState: State) => void;
};

export type PeerConnectionsState =
  | {
      status: 'init';
    }
  | {
      status: 'closed';
      destroy: () => void;
      open: (iceServers: IceServerRecord[], userId: string) => void;
    }
  | {
      status: 'ready';
      connected: boolean;
      connectionAttempted: boolean;
      connect: PeerConnections['connect'];
      disconnect: PeerConnections['disconnect'];
      destroy: () => void;
      client: PeerConnections;
    };

type Unsubscriber = () => void;

type State = PeerConnectionsState;

// The reason this is needed as a class is because it make the state
//  sync up with the various functions that use it much simpler vs an FCM
//  wihch has to use hooks and declare the needed state as a dependency!
//
export class PeerConnectionsHandler extends Component<
  PeerConnectionsStateProps,
  State
> {
  private peerConnections: PeerConnections | undefined;

  private eventListenerUnsubscribers: Unsubscriber[] = [];

  constructor(props: PeerConnectionsStateProps) {
    super(props);

    this.state = { status: 'init' };

    this.onStateUpdate();
  }

  componentDidMount() {
    // Open the connnection on mount
    this.open();
  }

  componentWillUnmount() {
    this.eventListenerUnsubscribers.forEach(invoke);

    this.destroy();
  }

  componentDidUpdate(_: PeerConnectionsStateProps, prevState: State) {
    // TODO: Make sure this is triggered on flag changes
    if (prevState !== this.state) {
      this.onStateUpdate();
    }
  }

  private onStateUpdate() {
    if (this.props.onStateUpdate) {
      this.props.onStateUpdate(this.state);
    }
  }

  private async open() {
    if (this.peerConnections) {
      return;
    }

    // This is dynamically load. It fixes SSR and also makes the initial code load smaller
    const { PeerConnections } = await import('./PeerConnections');

    this.peerConnections = new PeerConnections(this.props);

    this.eventListenerUnsubscribers = [
      ...this.eventListenerUnsubscribers,
      this.peerConnections.onOpen(() => {
        if (this.props.onOpen) {
          this.props.onOpen();
        }

        this.setState({
          status: 'ready',
          connected: false,
          client: this.peerConnections,
          connect: this.connect.bind(this),
          disconnect: this.disconnect.bind(this),
          destroy: this.destroy.bind(this),
        });
      }),
      this.peerConnections.onClose(() => {
        if (this.props.onClose) {
          this.props.onClose();
        }

        this.setState({
          status: 'closed',
          open: this.open.bind(this),
          destroy: this.destroy.bind(this),
        });
      }),
      this.peerConnections.onPeerConnected((...args) => {
        if (this.props.onPeerConnected) {
          this.props.onPeerConnected(...args);
        }

        this.setState((prev) => {
          if (!this.peerConnections && prev.status === 'ready') {
            return prev;
          }

          return {
            ...prev,
            connected: true,
          };
        });
      }),
      this.peerConnections.onPeerDisconnected((peerId) => {
        if (this.props.onPeerDisconnected) {
          this.props.onPeerDisconnected(peerId);
        }

        this.setState((prev) => {
          if (!(this.peerConnections && prev.status === 'ready')) {
            return prev;
          }

          return {
            ...prev,
            connected: Object.keys(this.peerConnections.connections).length > 0,
          };
        });
      }),
      this.peerConnections.onPeerStream((...args) => {
        if (this.props.onPeerStream) {
          this.props.onPeerStream(...args);
        }
      }),
      this.peerConnections.onError((...args) => {
        if (this.props.onError) {
          this.props.onError(...args);
        }
      }),
    ];
  }

  private destroy() {
    if (this.peerConnections) {
      this.peerConnections.destroy();
      this.peerConnections = undefined;

      this.setState({
        status: 'closed',
        open: this.open.bind(this),
        destroy: this.destroy.bind(this),
      });
    }
  }

  private connect(peers: Parameters<PeerConnections['connect']>[0]) {
    if (!(this.state.status === 'ready' && this.peerConnections)) {
      return;
    }

    this.peerConnections.connect(peers);

    this.setState((prev) => {
      if (prev.status !== 'ready') {
        return prev;
      }

      return {
        ...prev,
        connectionAttempted: true,
      };
    });
  }

  private disconnect() {
    if (this.peerConnections) {
      this.peerConnections.disconnect();
    }
  }

  render() {
    return null;
  }
}
