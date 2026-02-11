'use client';

import { DependencyList, useMemo } from 'react';

export const useCallbackIf = <T extends Function>(
  condition: boolean,
  cb: T,
  deps: DependencyList,
  cbFallback = undefined
) => useMemo(() => (condition ? cb : cbFallback), [condition, ...deps]);
