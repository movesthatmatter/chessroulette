import { User } from '@/modules/User/type';
import { useUpdateableSearchParams } from '@/hooks/useSearchParams';
import { CustomSession } from '@/services/Auth';
import { generateGuestUserId, generateUserId } from '@/lib/misc';

const getOrSetUserIdInSearchParams = (
  params: ReturnType<typeof useUpdateableSearchParams>,
  nextUserId: string
) => {
  const current = params.get('userId');

  if (typeof current === 'string' && current.length > 0) {
    return current;
  }

  params.set((prev) => ({
    ...prev,
    userId: nextUserId,
  }));

  return nextUserId;
};

export const useExistentUserIdOr = (
  newUserId: string = generateUserId()
): string => {
  return getOrSetUserIdInSearchParams(useUpdateableSearchParams(), newUserId);
};

export const useUser = (idIfInexistent?: string): User => {
  const userId = useExistentUserIdOr(idIfInexistent);
  const params = useUpdateableSearchParams();

  return {
    id: userId,
    displayName: params.get('userDisplayName') || undefined,
  };
};

export const useSessionUserOrSetAsGuest = (session?: CustomSession): User => {
  const params = useUpdateableSearchParams();

  if (session?.user) {
    return session.user;
  }

  const userId = getOrSetUserIdInSearchParams(params, generateGuestUserId());

  return {
    id: userId,
    displayName: params.get('userDisplayName') || 'guest',
  };
};
