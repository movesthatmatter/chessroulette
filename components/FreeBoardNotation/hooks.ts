import useEventListener from '@use-it/event-listener';
import { isOneOf, keyInObject } from '@/lib/misc';
import {
  FBHHistory,
  FBHIndex,
  FBHRecursiveMove,
  FreeBoardHistory,
} from '@/lib/FreeBoardHistory';

const arrowsMap = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
} as const;

export const useKeyboardEventListener = (
  onPress: (a: KeyboardEvent['key'], event: KeyboardEvent) => void,
) => {
  useEventListener('keydown', (event: KeyboardEvent) => {
    if (keyInObject(event, 'key')) {
      onPress(event.key, event);
    }
  });
};

export const useArrowsListener = (
  onPress: (a: 'left' | 'right' | 'up' | 'down') => void,
) => {
  useEventListener('keydown', (event: KeyboardEvent) => {
    if (
      keyInObject(event, 'key') &&
      isOneOf(event.key, ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'])
    ) {
      onPress(arrowsMap[event.key]);
    }
  });
};

export const useKeysToRefocusHistory = (
  history: FBHHistory,
  currentIndex: FBHIndex,
  onRefocus: (i: FBHIndex, move?: FBHRecursiveMove) => void,
) => {
  useArrowsListener((arrow) => {
    if (!isOneOf(arrow, ['left', 'right'])) {
      return;
    }

    if (
      arrow === 'right' &&
      FreeBoardHistory.findMoveAtIndex(history, currentIndex)?.branchedHistories
    ) {
      // If the current move needs to show the branches histories stop!
      return;
    }

    const nextIndex = FreeBoardHistory.findNextValidMoveIndex(
      history,
      currentIndex,
      arrow,
    );

    const isStartingIndex = FreeBoardHistory.areIndexesEqual(
      nextIndex,
      FreeBoardHistory.getStartingIndex(),
    );

    const isDifferentThanCurrent = !FreeBoardHistory.areIndexesEqual(
      nextIndex,
      currentIndex,
    );

    const foundMove = FreeBoardHistory.findMoveAtIndex(history, nextIndex);

    if ((foundMove || isStartingIndex) && isDifferentThanCurrent) {
      onRefocus(nextIndex, foundMove);
    }
  });
};
