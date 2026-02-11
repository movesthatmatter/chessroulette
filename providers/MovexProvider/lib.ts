import { MovexBoundResource } from 'movex';
import { MovexClientInfo } from './types';
import { UsersMap } from '@/modules/User';
import { objectKeys } from '@/lib/misc';

export const movexSubcribersToUserMap = (
  subscribers: MovexBoundResource['subscribers']
) =>
  objectKeys(subscribers).reduce(
    (prev, nextSubscriberId) => ({
      ...prev,
      [nextSubscriberId]: {
        id: nextSubscriberId,
        displayName: (subscribers[nextSubscriberId].info as MovexClientInfo)
          .displayName,
      },
    }),
    {} as UsersMap
  );
