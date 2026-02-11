import React from 'react';
import { Menu, Item, useContextMenu, ItemParams } from 'react-contexify';
import 'react-contexify/dist/ReactContexify.css';
import {
  FBHIndex,
  FBHMove,
  FBHRecursiveIndexes,
  FBHTurn,
} from '@/lib/FreeBoardHistory';
import { Text } from '../../Text';
import { NestedLists } from './NestedHistoryLists';
import { HistoryMove } from './HistoryMove';

export type RowProps = {
  rowId: string;
  historyTurn: FBHTurn;
  historyTurnIndex: number;
  onFocus: (i: FBHIndex) => void;
  onDelete: (i: FBHIndex) => void;
  focusedOnMovePosition?: 0 | 1;
  focusedOnRecursiveIndexes?: FBHRecursiveIndexes;
  className?: string;
  containerClassName?: string;
  moveCount?: number;
  nextValidMoveAndIndex?: [FBHMove, FBHIndex];
  canDelete?: boolean;
} & (
  | {
      isNested: true;
      rootHistoryIndex: FBHIndex;
    }
  | {
      isNested?: boolean;
      rootHistoryIndex?: undefined;
    }
);

export const HistoryRow = React.forwardRef<HTMLDivElement | null, RowProps>(
  (
    {
      rowId,
      historyTurn: [whiteMove, blackMove],
      historyTurnIndex,
      onFocus,
      onDelete,
      className,
      containerClassName,
      moveCount = historyTurnIndex + 1,
      focusedOnMovePosition,
      focusedOnRecursiveIndexes,
      nextValidMoveAndIndex,
      isNested = false,
      canDelete = true,
    },
    ref,
  ) => {
    const { show } = useContextMenu({ id: rowId });

    const whiteMoveIndex: FBHIndex = [historyTurnIndex, 0];
    const blackMoveIndex: FBHIndex = [historyTurnIndex, 1];

    const shouldSplit = !!whiteMove.branchedHistories;

    const blackMoveRender = (
      <HistoryMove
        move={blackMove}
        color="b"
        isFocused={!focusedOnRecursiveIndexes && focusedOnMovePosition === 1}
        onContextMenu={(event) => show({ event, props: { color: 'black' } })}
        onFocus={onFocus}
        rootHistoryIndex={blackMoveIndex}
        nextValidMoveAndIndex={nextValidMoveAndIndex}
      />
    );

    const handleOnDelete = ({ props }: ItemParams) => {
      if (props.color === 'white') {
        onDelete(whiteMoveIndex);
      }

      if (props.color === 'black') {
        onDelete(blackMoveIndex);
      }
    };

    return (
      <div className={containerClassName} ref={isNested ? undefined : ref}>
        <div className={`flex ${className} ${shouldSplit && 'flex-col'}`}>
          <div id="header" className="flex flex-1 relative">
            <Text className="flex-0 p-1 pr-2 cursor-pointer">{moveCount}.</Text>
            <HistoryMove
              move={whiteMove}
              color="w"
              isFocused={
                !focusedOnRecursiveIndexes && focusedOnMovePosition === 0
              }
              onFocus={onFocus}
              onContextMenu={(event) =>
                show({ event, props: { color: 'white' } })
              }
              rootHistoryIndex={whiteMoveIndex}
              nextValidMoveAndIndex={nextValidMoveAndIndex}
            />
            {shouldSplit ? (
              <Text
                className={`flex-1 cursor-pointer p-1 hover:bg-slate-500`}
                onContextMenu={(event) =>
                  show({ event, props: { color: 'white' } })
                }
              >
                ...
              </Text>
            ) : (
              blackMoveRender
            )}
          </div>
          {whiteMove.branchedHistories && (
            <NestedLists
              branchedHistories={whiteMove.branchedHistories}
              rootHistoryIndex={whiteMoveIndex}
              onFocus={onFocus}
              onDelete={onDelete}
              className="pl-2 mt-2 border-l border-slate-500 ml-1 sbg-red-500"
              rowClassName={containerClassName}
              focusedRecursiveIndexes={focusedOnRecursiveIndexes}
              canDelete={canDelete}
            />
          )}
          {shouldSplit && (
            <div className="flex flex-1">
              <Text className="flex-0 p-1 pr-2 cursor-pointer">
                {moveCount}.
              </Text>
              <Text
                className="flex-1 cursor-pointer p-1 hover:bg-slate-500"
                onContextMenu={(event) =>
                  show({ event, props: { color: 'black' } })
                }
              >
                ...
              </Text>
              {blackMoveRender}
            </div>
          )}
        </div>
        {blackMove?.branchedHistories && (
          <NestedLists
            branchedHistories={blackMove.branchedHistories}
            rootHistoryIndex={blackMoveIndex}
            onFocus={onFocus}
            onDelete={onDelete}
            className="pl-2 mt-2 border-l border-slate-500 ml-1 sbg-blue-500"
            rowClassName={containerClassName}
            focusedRecursiveIndexes={focusedOnRecursiveIndexes}
            canDelete={canDelete}
          />
        )}
        {canDelete && (
          <Menu id={rowId}>
            <Item
              id="delete"
              onClick={handleOnDelete}
              className="hover:cursor-pointer"
            >
              Delete from here
            </Item>
          </Menu>
        )}
      </div>
    );
  },
);
