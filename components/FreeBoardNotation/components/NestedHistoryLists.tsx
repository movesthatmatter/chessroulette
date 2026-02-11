import { useMemo } from 'react';
import { List } from './HistoryList';
import { RowProps } from './HistoryRow';
import {
  FBHHistory,
  FBHIndex,
  FBHRecursiveIndexes,
} from '@/lib/FreeBoardHistory';

type Props = {
  branchedHistories: FBHHistory[];
  rootHistoryIndex: FBHIndex;
  onFocus: (i: FBHIndex) => void;
  onDelete: (i: FBHIndex) => void;
  focusedRecursiveIndexes?: FBHRecursiveIndexes;
  rowClassName?: RowProps['className'];
  className?: string;
  canDelete?: boolean;
};

export const NestedLists = ({
  branchedHistories,
  rootHistoryIndex,
  focusedRecursiveIndexes,
  className,
  rowClassName,
  canDelete,
  onFocus,
  onDelete,
}: Props) => {
  const rootHistoryIndexWithoutNested = useMemo(
    () => [rootHistoryIndex[0], rootHistoryIndex[1]] satisfies FBHIndex,
    [rootHistoryIndex],
  );
  const [rootTurnIndex, rootMovePosition] = rootHistoryIndexWithoutNested;

  const constructNestedIndex = (
    nestedIndex: FBHIndex,
    paralelBranchIndex: number,
  ): FBHIndex => [
    rootTurnIndex,
    rootMovePosition,
    [nestedIndex, paralelBranchIndex],
  ];

  return (
    <>
      {branchedHistories.map((branchedHistory, branchIndex) => (
        <List
          key={`${rootTurnIndex}-${rootMovePosition}--${branchIndex}`}
          history={branchedHistory}
          onRefocus={(ni) => onFocus(constructNestedIndex(ni, branchIndex))}
          onDelete={(ni) => onDelete(constructNestedIndex(ni, branchIndex))}
          className={className}
          rowClassName={rowClassName}
          isNested
          rootHistoryIndex={rootHistoryIndexWithoutNested}
          canDelete={canDelete}
          focusedIndex={
            focusedRecursiveIndexes?.[0] !== -1 &&
            focusedRecursiveIndexes?.[1] === branchIndex
              ? focusedRecursiveIndexes[0]
              : undefined
          }
        />
      ))}
    </>
  );
};
