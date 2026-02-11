import { useMemo } from 'react';
import { useUrl } from 'nextjs-current-url';
import { useRoomSettings } from './useRoomSettings';
import { RoomActivityType, links } from '../links';
import { useRoomDetails } from './useRoomDetails';

export const useRoomLinkId = (activity: RoomActivityType) => {
  const url = useUrl();
  const roomSettings = useRoomSettings(activity);
  const roomId = useRoomDetails();

  const joinRoomLink = useMemo(() => {
    if (!(roomSettings.showJoinRoomLink && url && roomId)) {
      return undefined;
    }

    return links.getJoinRoomLink(
      {
        id: roomId.roomId,
        activity,
        theme: roomSettings.theme,
        ...roomSettings.joinRoomLinkParams,
      },
      {
        origin: url.origin,
      }
    );
  }, [roomSettings.showJoinRoomLink, activity, url?.origin]);

  return {
    joinRoomLink,
  };
};
