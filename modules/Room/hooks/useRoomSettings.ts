'use client';

import { useUpdateableSearchParams } from '@/hooks/useSearchParams';
import { useLearnActivitySettings } from '../activities/Learn';
import { ActivityState } from '../activities/movex';
import { invoke } from '@/lib/misc';
import { useMeetupActivitySettings } from '../activities/Meetup/useMeetupActivitySettings';
import { JoinRoomLinkProps } from '../activities/Learn/activitySettings';

export type RoomSettings = {
  theme: string | undefined; // TODO: this can be more specific
} & JoinRoomLinkProps;

/**
 * This contains all of the room specific settings (search params, user persisted or local storage)
 *
 * @returns
 */
export const useRoomSettings = (
  activity: ActivityState['activityType']
): RoomSettings => {
  const updateableSearchParams = useUpdateableSearchParams();
  const learnActivitySettings = useLearnActivitySettings();
  const meetupActivitySettings = useMeetupActivitySettings();

  const joinRoomLinkProps = invoke((): JoinRoomLinkProps => {
    if (activity === 'learn') {
      return learnActivitySettings;
    }

    if (activity === 'meetup') {
      // This can come from a specific useMeetupActivitySettings
      return meetupActivitySettings;
    }

    return {
      showJoinRoomLink: false,
    };
  });

  return {
    theme: updateableSearchParams.get('theme') || undefined,
    ...joinRoomLinkProps,
  };
};
