'use client';

import React from 'react';
import { User } from '@/modules/User/type';
import {
  PeerConnectionsContext,
  PeerConnectionsContextState,
} from './PeerConnectionsContext';
import {
  PeerConnectionsHandler,
  PeerConnectionsState,
  PeerConnectionsStateProps,
} from './PeerConnectionsHandler';
import { PeerConnectionsErrors } from './PeerConnections';
import { IceServerRecord, Peer, PeerUserId, PeerUserIdsMap } from './type';

type Props = React.PropsWithChildren<{
  uniqId: string; // Make sure this changes each time is need (i.e. when the room changes)
  clientUserId: User['id'];
  iceServers: IceServerRecord[];

  onOpen?: PeerConnectionsStateProps['onOpen'];
  onPeerConnected?: PeerConnectionsStateProps['onPeerConnected'];
  onPeerStream?: PeerConnectionsStateProps['onPeerStream'];
  onPeerDisconnected?: PeerConnectionsStateProps['onPeerDisconnected'];
  onClose?: PeerConnectionsStateProps['onClose'];
  onError?: PeerConnectionsStateProps['onError'];

  onPeerConnectionChannelsUpdated?: (p: {
    peerUserId: Peer['userId'];
    channels: Partial<Peer['connection']['channels']>;
  }) => void;
}>;

type State = {
  peerConnectionsState: PeerConnectionsState;
  contextState: PeerConnectionsContextState;
  iceServers: IceServerRecord[] | undefined;
};

export class PeerToPeerProvider extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      peerConnectionsState: { status: 'init' },
      contextState: { ready: false },
      iceServers: props.iceServers,
    };

    this.connectToPeers = this.connectToPeers.bind(this);
    this.disconnectFromAllPeers = this.disconnectFromAllPeers.bind(this);

    // Peer Connection Handlers
    this.onOpen = this.onOpen.bind(this);
    this.onClose = this.onClose.bind(this);
    this.onError = this.onError.bind(this);
    this.onPeerConnected = this.onPeerConnected.bind(this);
    this.onPeerStream = this.onPeerStream.bind(this);
    this.onPeerDisconnected = this.onPeerDisconnected.bind(this);

    // Other
    this.onStateUpdated = this.onStateUpdated.bind(this);
  }

  componentDidUpdate(_: Props, prevState: State) {
    if (!(prevState.peerConnectionsState === this.state.peerConnectionsState)) {
      this.setState({
        contextState: this.getNextContextState(prevState.contextState),
      });
    }
  }

  private getNextContextState(
    prev: State['contextState']
  ): PeerConnectionsContextState {
    if (this.state.peerConnectionsState.status === 'ready') {
      return {
        ready: true,
        client: this.state.peerConnectionsState.client,
        connectToPeers: this.connectToPeers,
        disconnectFromAllPeers: this.disconnectFromAllPeers,
        connectionAttempted:
          this.state.peerConnectionsState.connectionAttempted,
      };
    }

    return {
      ready: false,
    };
  }

  private connectToPeers(peersUserIdsMap: PeerUserIdsMap) {
    // TODO: Ensure the "connectionAttempted" works here, and it resets each time there is a new room
    if (
      this.state.peerConnectionsState.status === 'ready' &&
      !this.state.peerConnectionsState.connectionAttempted
    ) {
      this.state.peerConnectionsState.connect(peersUserIdsMap);
    }
  }

  private disconnectFromAllPeers() {
    if (this.state.peerConnectionsState.status === 'ready') {
      this.state.peerConnectionsState.disconnect();
    }
  }

  private onOpen = () => {
    this.props.onOpen?.();
  };

  private onClose = () => {
    this.props.onClose?.();
  };

  private onError = (e: PeerConnectionsErrors) => {
    this.props.onError?.(e);
  };

  private onPeerConnected = (peerUserId: PeerUserId) => {
    this.props.onPeerConnected?.(peerUserId);

    this.props.onPeerConnectionChannelsUpdated?.({
      peerUserId,
      channels: {
        data: { on: true }, // TODO: Should this be updated from here as well?
      },
    });
  };

  private onPeerStream = (props: {
    peerUserId: PeerUserId;
    stream: MediaStream;
  }) => {
    this.props.onPeerStream?.(props);

    this.props.onPeerConnectionChannelsUpdated?.({
      peerUserId: props.peerUserId,
      channels: {
        data: { on: true }, // TODO: Should this be updated from here as well?
        streaming: {
          on: true,
          stream: props.stream,
          type: 'audio-video',
        },
      },
    });
  };

  private onPeerDisconnected = (peerUserId: PeerUserId) => {
    this.props.onPeerDisconnected?.(peerUserId);

    this.props.onPeerConnectionChannelsUpdated?.({
      peerUserId,
      channels: {
        data: { on: false },
        streaming: { on: false },
      },
    });
  };

  private onStateUpdated = (nextPeerConnectionsState: PeerConnectionsState) => {
    this.setState({ peerConnectionsState: nextPeerConnectionsState });
  };

  render() {
    return (
      <>
        {this.props.iceServers && (
          <PeerConnectionsHandler
            // Reset this once the id changes
            key={this.props.uniqId}
            iceServers={this.props.iceServers}
            clientUserId={this.props.clientUserId}
            onPeerConnected={this.onPeerConnected}
            onClose={this.onClose}
            onOpen={this.onOpen}
            onError={this.onError}
            onPeerDisconnected={this.onPeerDisconnected}
            onPeerStream={this.onPeerStream}
            onStateUpdate={this.onStateUpdated}
          />
        )}
        <PeerConnectionsContext.Provider value={this.state.contextState}>
          {this.props.children}
        </PeerConnectionsContext.Provider>
      </>
    );
  }
}
