'use client';

import { searchParamsToObject } from '@/hooks/useSearchParams';
import { useSearchParams } from 'next/navigation';
import { get_UNSAFE_URL_SESSION } from '@/services/Auth/lib';
import { getLearnRoutes_WITH_UNSAFE_SESSION_IN_URL } from '../links';

export const useLearnRoutes_WITH_UNSAFE_SESSOIN_IN_URL = () => {
  const searchParams = useSearchParams();

  const session = get_UNSAFE_URL_SESSION(searchParamsToObject(searchParams));

  if (!session) {
    return {};
  }

  return getLearnRoutes_WITH_UNSAFE_SESSION_IN_URL(session);
};
