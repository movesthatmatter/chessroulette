import React from 'react';
import { VideoElement } from './VideoElement';

type VideoAttributes = React.DetailedHTMLProps<
  React.VideoHTMLAttributes<HTMLVideoElement>,
  HTMLVideoElement
>;

export type VideoBoxProps = VideoAttributes & {
  stream: MediaStream;
  mirrorImage?: boolean;
};

export const VideoBox: React.FunctionComponent<VideoBoxProps> = ({
  stream,
  className,
  mirrorImage = false,
  ...videoProps
}) => {
  return (
    <VideoElement
      // Make sure the video refreshes if the stream id changes
      key={stream.id}
      className={className}
      {...videoProps}
      onMounted={(ref) => {
        ref.srcObject = stream;
      }}
      style={{
        ...(mirrorImage && {
          transform: 'rotateY(180deg)',
        }),
      }}
    />
  );
};
