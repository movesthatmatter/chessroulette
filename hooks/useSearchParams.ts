import { invoke, objectKeys, toDictIndexedBy } from '@/lib/misc';
import {
  ReadonlyURLSearchParams,
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation';
import { useMemo } from 'react';

export type SearchParamsRecord = Record<string, string | number | undefined>;

export const useUpdateableSearchParams = () => {
  const currentSearchParams = useSearchParams();
  const router = useRouter();
  const pathName = usePathname();

  return useMemo(
    () => ({
      get: (key: string) => {
        return currentSearchParams.get(key);
      },
      /**
       * This changes the URL
       *
       * @param nextSearchParams
       * @returns
       */
      set: (
        nextSearchParams?:
          | SearchParamsRecord
          | ((prev: SearchParamsRecord) => SearchParamsRecord)
      ) => {
        const searchParams = new URLSearchParams(
          currentSearchParams.toString()
        );

        const next = invoke(() => {
          if (typeof nextSearchParams === 'function') {
            return nextSearchParams(searchParamsToObject(currentSearchParams));
          }

          return nextSearchParams || {};
        });

        objectKeys(next).forEach((key) => {
          const nextVal = next[key];

          if (nextVal) {
            searchParams.set(key, String(next[key]));
          } else {
            searchParams.delete(key);
          }
        });

        // Change the URL
        router.push(`${pathName}?${searchParams.toString()}`);
      },

      current: () => currentSearchParams,
      toObject: () =>
        toDictIndexedBy(
          Array.from(currentSearchParams.entries()),
          ([key]) => key,
          ([, val]) => val
        ),
    }),
    [currentSearchParams]
  );
};

export const searchParamsToObject = (sp: ReadonlyURLSearchParams) =>
  toDictIndexedBy(
    Array.from(sp.entries()),
    ([key]) => key,
    ([, val]) => val
  );
