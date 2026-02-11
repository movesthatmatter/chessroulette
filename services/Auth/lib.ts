import { CustomSession } from './types';
import { StringRecord } from '@/lib/misc';

/**
 * This is used only temporary for the Outpost MVP to save time.
 * They prefer to pass the userId in the URL so I use this for now as well.
 *
 * But, after tge MVP, when Chessroulette will build its own auth again this will be depreacated.
 *   Ideally, Outpost users will have to authenticate on chessroulette as well (using Oauth2 via Outpost best suggestion),
 * but if that's not the case, just for outpost users can still use this form!
 *
 *
 * @param searchParams
 * @returns
 */
export const get_UNSAFE_URL_SESSION = (searchParams: StringRecord) => {
  if (searchParams.userId) {
    return {
      user: {
        id: searchParams.userId,
        displayName: searchParams.userDisplayName,
      },
      expires: '2222-11-22T22:22:22.222Z',
    } satisfies CustomSession;
  }

  return undefined;
};

export const sessionToSearchParams = (session: CustomSession) => ({
  userId: session.user.id,
  ...(session.user.displayName && {
    userDisplayName: session.user.displayName,
  }),
});
