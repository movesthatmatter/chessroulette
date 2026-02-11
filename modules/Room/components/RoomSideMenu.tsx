'use client';

import Link from 'next/link';
import { ClipboardCopyButton } from '@/components/ClipboardCopyButton';
import { Icon } from '@/components/Icon';
import { RoomActivityType } from '../links';
import { useRoomSettings, useRoomLinkId } from '../hooks';

type Props = {
  roomId: string;
  activity: RoomActivityType;
};

export const RoomSideMenu = ({ activity }: Props) => {
  const roomSettings = useRoomSettings(activity);
  const { joinRoomLink } = useRoomLinkId(activity);

  return (
    <div className="flex flex-col items-center gap-4">
      {joinRoomLink && (
        <ClipboardCopyButton
          buttonComponentType="Button"
          value={joinRoomLink}
          render={(copied) => (
            <>
              {copied ? (
                <Link
                  href={joinRoomLink}
                  target="_blank"
                  onClick={(e) => e.preventDefault()}
                >
                  <Icon name="CheckIcon" className="w-4 h-4" />
                </Link>
              ) : (
                <Icon name="PaperAirplaneIcon" className="w-4 h-4" />
              )}
            </>
          )}
          bgColor="green"
          type="custom"
          size="sm"
          tooltip={roomSettings.joinRoomLinkTooltip || 'Invite Opponent'}
        />
      )}
    </div>
  );
};
