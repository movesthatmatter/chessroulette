import React, { useEffect, useMemo, useRef } from 'react';
import debounce from 'debounce';
import useDebouncedEffect from 'use-debounced-effect';
import { HistoryRow } from './HistoryRow';
import {
  FBHHistory,
  FBHIndex,
  FBHMove,
  FreeBoardHistory,
} from '@/lib/FreeBoardHistory';

export type ListProps = {
  history: FBHHistory;
  onRefocus: (atIndex: FBHIndex) => void;
  onDelete: (atIndex: FBHIndex) => void;
  focusedIndex?: FBHIndex;
  className?: string;
  rowClassName?: string;
  canDelete?: boolean;
} & (
  | {
      isNested: true;
      rootHistoryIndex: FBHIndex;
    }
  | {
      isNested?: false;
      rootHistoryIndex?: undefined;
    }
);

const scrollIntoView = debounce((elm: HTMLDivElement) => {
  elm.scrollIntoView({ block: 'end', behavior: 'auto' });
}, 5);

export const List: React.FC<ListProps> = ({
  history,
  focusedIndex,
  onRefocus,
  onDelete,
  className,
  rowClassName,
  rootHistoryIndex,
  isNested = false,
  canDelete,
}) => {
  const rowElementRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const containerElementRef = useRef<HTMLDivElement | null>();

  useDebouncedEffect(
    () => {
      if (isNested) {
        return;
      }

      if (history.length === 0) {
        return;
      }

      if (!focusedIndex) {
        return;
      }

      const [focusedTurnIndex] = focusedIndex;

      if (!focusedTurnIndex) {
        return;
      }

      const elm = rowElementRefs.current[focusedTurnIndex];

      if (elm) {
        scrollIntoView(elm);
      }
    },
    100,
    [history, focusedIndex, isNested],
  );

  useEffect(() => {
    setTimeout(() => {
      if (containerElementRef.current) {
        containerElementRef.current.scrollTo(0, 9999);
      }
    }, 100);
  }, []);

  const [focusedTurnIndex, focusedMovePosition, recursiveFocusedIndexes] =
    focusedIndex || [];

  const nextValidMoveAndIndex = useMemo<[FBHMove, FBHIndex] | undefined>(() => {
    if (!focusedIndex) {
      return undefined;
    }

    const index = FreeBoardHistory.findNextValidMoveIndex(
      history,
      focusedIndex,
      'right',
    );

    const move = FreeBoardHistory.findMoveAtIndex(history, index);

    if (!move) {
      return undefined;
    }

    return [move, index];
  }, [history, focusedIndex]);

  return (
    <div
      className={className}
      ref={(e) => {
        containerElementRef.current = e;
      }}
    >
      {history.map((historyTurn, historyTurnIndex) => {
        const rootHistoryTurnIndex = rootHistoryIndex?.[0] || 0;

        const rowId = `${rootHistoryTurnIndex + historyTurnIndex}.${
          historyTurn[0].san
        }-${historyTurn[1]?.san || ''}`;

        return (
          <HistoryRow
            key={rowId}
            rowId={rowId}
            ref={(r) => {
              rowElementRefs.current[historyTurnIndex] = r;
            }}
            canDelete={canDelete}
            historyTurn={historyTurn}
            historyTurnIndex={historyTurnIndex}
            moveCount={rootHistoryTurnIndex + 1 + historyTurnIndex}
            onFocus={onRefocus}
            onDelete={onDelete}
            focusedOnMovePosition={
              historyTurnIndex === focusedTurnIndex
                ? focusedMovePosition
                : undefined
            }
            focusedOnRecursiveIndexes={
              historyTurnIndex === focusedTurnIndex
                ? recursiveFocusedIndexes
                : undefined
            }
            containerClassName={rowClassName}
            nextValidMoveAndIndex={nextValidMoveAndIndex}
            {...(isNested
              ? {
                  isNested: true,
                  rootHistoryIndex,
                }
              : {
                  isNested: false,
                })}
          />
        );
      })}
    </div>
  );
};
