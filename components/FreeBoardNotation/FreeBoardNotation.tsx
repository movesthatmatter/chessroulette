import React from 'react';
import { List, ListProps } from './components/HistoryList';
import { useKeysToRefocusHistory } from './hooks';
import { FBHHistory, FreeBoardHistory } from '@/lib/FreeBoardHistory';

export type FreeBoardNotationProps = {
  history?: FBHHistory;
  focusedIndex?: ListProps['focusedIndex'];
  onRefocus: ListProps['onRefocus'];
  onDelete: ListProps['onDelete'];
  emptyContent?: string | React.ReactNode;
  className?: string;
  containerClassName?: string;
  canDelete?: boolean;
};

/**
 * A component that works with FreeBoardHistory library (util-kit), and is able to render free moves
 *
 * @param param0
 * @returns
 */
export const FreeBoardNotation: React.FC<FreeBoardNotationProps> = ({
  history = [],
  emptyContent = 'Wow, So Empty!',
  focusedIndex = FreeBoardHistory.getStartingIndex(),
  onRefocus,
  onDelete,
  canDelete,
  containerClassName = '',
  className = '',
}) => {
  useKeysToRefocusHistory(history, focusedIndex, onRefocus);

  return (
    <div
      className={`flex flex-col flex-1 min-h-0 min-w-0 ${containerClassName} `}
    >
      {history.length > 0 ? (
        <List
          history={history}
          focusedIndex={focusedIndex}
          onRefocus={onRefocus}
          onDelete={onDelete}
          className={`flex flex-1 flex-col overflow-scroll ${className}`}
          rowClassName="border-b border-slate-600"
          canDelete={canDelete}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-500">
          {emptyContent}
        </div>
      )}
    </div>
  );
};
