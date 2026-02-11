import { useUpdateableSearchParams } from '@/hooks/useSearchParams';
import { useMemo } from 'react';

export const useWidgetPanelTabsNavAsSearchParams = () => {
  const updateableSearchParams = useUpdateableSearchParams();

  return useMemo(
    () => ({
      // TODO: tabId can actually be typed if needed at some point
      setTabId: (tabId: string, stackIndex?: number) => {
        updateableSearchParams.set((prev) => ({
          ...prev,
          tabId,
          tabStackIndex: stackIndex, // setting to undefined to be removed whn not presetn
        }));
      },
      setTabIndex: (tabIndex: number, stackIndex?: number) => {
        updateableSearchParams.set((prev) => ({
          ...prev,
          tabIndex,
          tabStackIndex: stackIndex, // setting to undefined to be removed whn not presetn
        }));
      },
      stackTo: (stackIndex: number) => {
        updateableSearchParams.set((prev) => ({
          ...prev,
          tabStackIndex: stackIndex,
        }));
      },

      getCurrentTabId: () => updateableSearchParams.get('tabId') || undefined,
      getCurrentTabIndex: () =>
        Number(updateableSearchParams.get('tabIndex')) || 0,
      getCurrentTabStackIndex: () =>
        Number(updateableSearchParams.get('tabStackIndex')) || undefined,
    }),
    [updateableSearchParams]
  );
};
