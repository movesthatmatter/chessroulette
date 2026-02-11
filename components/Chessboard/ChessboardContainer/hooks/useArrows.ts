import {
  toChessArrowFromId,
  toChessArrowId,
} from '@/lib/ChessRouler';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { objectKeys } from 'movex-core-util';
import useDeepCompareEffect from 'use-deep-compare-effect';
import { shallowEqualObjects } from 'shallow-equal';
import { Arrow } from 'react-chessboard/dist/chessboard/types';
import { ArrowsMap } from '../../types';
import { useCallbackIf } from '@/lib/hooks';
import { toDictIndexedBy } from '@/lib/misc';

export const useCustomArrows = (
  onUpdate?: (next: ArrowsMap) => void,
  arrowsMap?: ArrowsMap
) => {
  const [localBoardArrowsMap, setLocalBoardArrowsMap] = useState<ArrowsMap>({});

  useDeepCompareEffect(() => {
    onArrowsChangeCb(localBoardArrowsMap);
  }, [localBoardArrowsMap]);

  const onArrowsChangeCb = useCallback(
    (nextLocalBoardArrowsMap: ArrowsMap) => {
      if (!onUpdate) {
        return;
      }

      if (!shallowEqualObjects(nextLocalBoardArrowsMap, arrowsMap)) {
        // Send them all outside
        onUpdate({
          ...arrowsMap,
          ...nextLocalBoardArrowsMap,
        });
      }
    },
    [onUpdate, arrowsMap, localBoardArrowsMap]
  );

  const arrowsToRender = useMemo(
    () =>
      objectKeys(arrowsMap || {})
        .filter((a) => !Object(localBoardArrowsMap).hasOwnProperty(a))
        .map(toChessArrowFromId),
    [localBoardArrowsMap, arrowsMap]
  );

  const [safelyMounted, setSafelyMounted] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      setSafelyMounted(true);
    }, 250);
  }, []);

  const updateArrowsMap = useCallbackIf(
    safelyMounted,
    (nextArrows: Arrow[]) => {
      if (nextArrows.length === 0 && Object.keys(arrowsMap || {}).length > 0) {
        // Reset when the arrows are set back to 0
        onUpdate?.({});
        return;
      }

      setLocalBoardArrowsMap(toDictIndexedBy(nextArrows, toChessArrowId));
    },
    []
  );

  return {
    updateArrowsMap,
    arrowsToRender,
  };
};
