import React, { ReactNode, useState } from 'react';
import { noop } from '@/lib/misc';
import { PeerStreamingConfig } from '@/modules/PeerToPeer/providers/PeerToPeerProvider/type';
import { AspectRatio, AspectRatioProps } from '@/components/AspectRatio';
import { Text } from '@/components/Text';
import { VideoBox, VideoBoxProps } from '../VideoBox';

export type FaceTimeProps = Omit<VideoBoxProps, 'stream'> & {
  streamConfig: PeerStreamingConfig;
  streamingOffFallback?: ReactNode;
  loadingFallback?: ReactNode;

  aspectRatio?: AspectRatioProps['aspectRatio'];
  containerClassName?: string;
  label?: string;
  labelClassName?: string;
  labelPosition?: 'bottom-left' | 'bottom-center' | 'bottom-right';

  headerOverlay?: ReactNode;
  mainOverlay?: ReactNode;
  footerOverlay?: ReactNode;

  onReady?: () => void;
};

export const FaceTime: React.FC<FaceTimeProps> = ({
  streamConfig,
  className,
  streamingOffFallback,
  containerClassName,
  label,
  footerOverlay,
  mainOverlay,
  headerOverlay,
  labelClassName = null,
  labelPosition = 'bottom-center',
  aspectRatio = {
    width: 4,
    height: 3,
  },
  loadingFallback = null,
  onReady = noop,
  mirrorImage = true, // mirroring all cameras by default
  ...avStreamProps
}) => {
  const [loadingVideo, setLoadingVideo] = useState(true);

  const loader = (
    <div className="absolute flex right-0 top-0 bottom-0 left-0 z-50">
      {loadingFallback}
    </div>
  );

  return (
    <div className={`relative ${containerClassName}`}>
      <AspectRatio aspectRatio={aspectRatio}>
        {streamConfig.on ? (
          <>
            <VideoBox
              stream={streamConfig.stream}
              autoPlay
              className={`w-full h-full object-cover ${className}`}
              {...avStreamProps}
              onCanPlay={() => {
                onReady();
                setLoadingVideo(false);
              }}
            />
            {loadingVideo && loader}
          </>
        ) : (
          streamingOffFallback || loader
        )}

        <div className="absolute inset-0 flex flex-col">
          <div className="flex-1">{mainOverlay}</div>
          <div>
            {label && (
              <div className="relative center z-50">
                <Text className={`px-1 pb-2 ${labelClassName}`}>{label}</Text>
              </div>
            )}
            {footerOverlay}
          </div>
        </div>
      </AspectRatio>
    </div>
  );
};
