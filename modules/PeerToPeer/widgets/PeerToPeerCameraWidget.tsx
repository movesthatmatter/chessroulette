import { config } from '@/config';
import { AspectRatio } from '@/components/AspectRatio';
import { FaceTimeProps, MultiFaceTimeCompact } from '../components';
import { DEV_CameraView } from '../components/DEV_CameraView';
import { usePeerStreaming } from '../PeerStreaming/hooks/usePeerStreaming';

type Props = {
  aspectRatio?: FaceTimeProps['aspectRatio'];
};

export const PeerToPeerCameraWidget = ({ aspectRatio = 16 / 9 }: Props) => {
  const peerStreaming = usePeerStreaming();

  if (!config.CAMERA_ON) {
    const hashDemoImgId = (id: string) => Number(id.match(/\d/)?.[0] || 0);
    return (
      <AspectRatio aspectRatio={aspectRatio}>
        <DEV_CameraView
          className={`w-full h-full object-covers`}
          demoImgId={hashDemoImgId(peerStreaming.clientUserId) as any}
        />
      </AspectRatio>
    );
  }

  return (
    <MultiFaceTimeCompact
      reel={peerStreaming.reel}
      aspectRatio={aspectRatio}
      onFocus={() => {
        // TBD
      }}
    />
  );
};
