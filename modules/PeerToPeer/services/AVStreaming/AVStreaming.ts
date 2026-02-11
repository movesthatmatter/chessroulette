import { AsyncResultWrapper } from 'ts-async-results';
import { Ok } from 'ts-results';
import { Pubsy } from 'ts-pubsy';
import { AVStreamingConstraints } from './types';

export const DEFAULT_AV_STREAMING_CONSTRAINTS = {
  audio: true,
  video: true,
};

// Note: As of Dec 5h, 2020, It currently doesn't seperate the Audio from Video if needed in the future!
class AVStreamingClass {
  public pubsy = new Pubsy<{
    onUpdateConstraints: AVStreamingConstraints;
  }>();

  private pendingStreamCreationPromise?: Promise<MediaStream>;

  public activeStreamsById: {
    [id: string]: MediaStream;
  } = {};

  private _activeConstraints: AVStreamingConstraints =
    DEFAULT_AV_STREAMING_CONSTRAINTS;

  set activeConstraints({ video, audio }: AVStreamingConstraints) {
    this._activeConstraints = {
      video,
      audio,
    };
  }

  get activeConstraints() {
    return this._activeConstraints;
  }

  private getAnActiveStream = () => {
    const firstActiveStreamId = Object.keys(this.activeStreamsById)[0];

    if (!firstActiveStreamId) {
      return undefined;
    }

    return this.activeStreamsById[firstActiveStreamId];
  };

  private hasActiveStream() {
    return !!this.getAnActiveStream();
  }

  private async createStream(
    constraints: AVStreamingConstraints
  ): Promise<MediaStream> {
    this.pendingStreamCreationPromise =
      navigator.mediaDevices.getUserMedia(constraints);

    const stream = await this.pendingStreamCreationPromise;

    this.activeStreamsById[stream.id] = stream;

    // Reset it again!
    this.pendingStreamCreationPromise = undefined;

    return stream;
  }

  destroyStreamById(streamId: string) {
    const { [streamId]: stream, ...restActiveStreams } = this.activeStreamsById;

    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });

      // Remove the stream from active
      this.activeStreamsById = restActiveStreams;
    }
  }

  // This is important because cloning requires permissions on some browsers
  //  so adding a delay highers the possibility to reuse one!
  // TODO: As of 12/09/2020 I haven't found a way to stop and restart the
  //  same getUserMedia stream, but if that would work than all we would need
  //  is to create one!
  destroyStreamByIdWithDelay(streamId: string, ms = 250) {
    setTimeout(() => {
      this.destroyStreamById(streamId);
    }, ms);
  }

  private cloneStream(stream: MediaStream) {
    const clonedStream = stream.clone();

    this.activeStreamsById[clonedStream.id] = clonedStream;

    return clonedStream;
  }

  private cloneAnActiveStream() {
    const stream = this.getAnActiveStream();

    if (!stream) {
      throw new Error('No active stream found!');
    }

    return this.cloneStream(stream);
  }

  async getStream(): Promise<MediaStream> {
    if (this.pendingStreamCreationPromise) {
      return this.pendingStreamCreationPromise.then((stream) => {
        // Cloning here is imperative, otherwise all of the calls get the
        //  same stream resulting in freezing on Safari
        return this.cloneStream(stream);
      });
    } else if (this.hasActiveStream()) {
      return this.cloneAnActiveStream();
    } else {
      return this.createStream(this.activeConstraints);
    }
  }

  updateConstraints(nextConstraints: AVStreamingConstraints) {
    const allActiveStreams = Object.values(this.activeStreamsById);

    allActiveStreams.forEach((stream) => {
      stream.getVideoTracks().forEach((videoTrack) => {
        videoTrack.enabled = nextConstraints.video;
      });

      stream.getAudioTracks().forEach((autioTrack) => {
        autioTrack.enabled = nextConstraints.audio;
      });
    });

    this._activeConstraints = nextConstraints;

    this.pubsy.publish('onUpdateConstraints', nextConstraints);
  }

  hasPermission(
    constraints: AVStreamingConstraints = {
      video: true,
      audio: true,
    }
  ) {
    return new AsyncResultWrapper<boolean, null>(() => {
      if (this.hasActiveStream()) {
        return Promise.resolve(new Ok(true));
      }

      return this.createStream(constraints).then(
        (stream) => {
          // Destroy the streamer right away
          this.destroyStreamById(stream.id);

          return new Ok(true);
        },
        () => {
          // TOOO: Check the error because it might be something else then permission
          return new Ok(false);
        }
      );
    });
  }
}

export type AVStreaming = AVStreamingClass;

let instance: AVStreaming;
export const getAVStreamingInstance = () => {
  if (!instance) {
    instance = new AVStreamingClass();
  }

  return instance;
};
