import React, { useRef, useEffect } from 'react';

type VideoAttributes = React.DetailedHTMLProps<
  React.VideoHTMLAttributes<HTMLVideoElement>,
  HTMLVideoElement
>;

export type VideoBoxProps = VideoAttributes & {
  onMounted: (ref: HTMLVideoElement) => void;
};

export const VideoElement: React.FunctionComponent<VideoBoxProps> = ({
  onMounted,
  className,
  ...videoProps
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const fn = () => {
      if (videoRef.current) {
        onMounted(videoRef.current);
      } else {
        setTimeout(fn, 250);
      }
    };

    fn();
  }, []);

  return (
    <video
      ref={videoRef}
      className={className}
      autoPlay
      playsInline
      {...videoProps}
    >
      <track kind="main" />
    </video>
  );
};
