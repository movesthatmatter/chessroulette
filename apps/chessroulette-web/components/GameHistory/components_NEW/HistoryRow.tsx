import React from 'react';
import { Menu, Item, useContextMenu, ItemParams } from 'react-contexify';
import 'react-contexify/dist/ReactContexify.css';
import { Text } from '../../Text';
import {
  ChessHistoryIndexMovePosition_NEW,
  ChessHistoryIndex_NEW,
  ChessHistoryTurn_NEW,
  ChessRecursiveHistoryIndex_NEW,
} from '../history/types';
import { NestedHistories } from './NestedHistories';
import { ChessColor, invoke } from '@xmatter/util-kit';

export type HistoryRowProps = {
  rowId: string;
  historyTurn: ChessHistoryTurn_NEW;
  historyTurnIndex: number;
  onFocus: (i: ChessHistoryIndex_NEW) => void;
  onDelete: (i: ChessHistoryIndex_NEW) => void;
  focusedIndex?: ChessRecursiveHistoryIndex_NEW;
  // isFocused?: ChessColor;
  isNested?: boolean;
  className?: string;
  containerClassName?: string;
};

export const HistoryRow = React.forwardRef<
  HTMLDivElement | null,
  HistoryRowProps
>(
  (
    {
      rowId,
      historyTurn: [whiteMove, blackMove],
      historyTurnIndex,
      onFocus,
      onDelete,
      className,
      // focus,
      focusedIndex,
      containerClassName,
      isNested = false,
    },
    ref
  ) => {
    const whiteMoveIndex: ChessHistoryIndex_NEW = [historyTurnIndex, 0];
    const blackMoveIndex: ChessHistoryIndex_NEW = [historyTurnIndex, 1];

    const moveCount = historyTurnIndex + 1;

    const { show } = useContextMenu({ id: rowId });

    const handleOnDelete = ({ props }: ItemParams) => {
      if (props.color === 'white') {
        onDelete(whiteMoveIndex);
      }

      if (props.color === 'black') {
        onDelete(blackMoveIndex);
      }
    };

    const [focusedTurnIndex, focusedMovePosition, focusedNestedIndex] =
      focusedIndex || [];
    const focus = invoke(() => {
      console.log("row invoke foucs", focusedIndex, focusedTurnIndex, historyTurnIndex)

      if (focusedNestedIndex) {
        return undefined;
      }

      if (focusedTurnIndex === historyTurnIndex) {
        return focusedMovePosition;
      }
    });

    return (
      <div className={containerClassName} ref={isNested ? undefined : ref}>
        <Menu id={rowId}>
          <Item
            id="delete"
            onClick={handleOnDelete}
            className="hover:cursor-pointer"
          >
            Delete from here
          </Item>
        </Menu>
        <div className={`flex ${className}`}>
          <Text className="flex-0 p-1 pr-2 cursor-pointer">{moveCount}.</Text>
          <Text
            className={`flex-1 cursor-pointer p-1 sbg-slate-600 hover:bg-slate-500 ${
              focus === 0 && 'font-black bg-slate-600'
            }`}
            onClick={() => onFocus(whiteMoveIndex)}
            onContextMenu={(event) =>
              show({ event, props: { color: 'white' } })
            }
          >
            {whiteMove.san}
          </Text>

          {blackMove ? (
            <Text
              className={`flex-1 cursor-pointer p-1 sbg-slate-400 hover:bg-slate-500 ${
                focus === 1 && 'font-black bg-slate-600'
              }`}
              onClick={() => onFocus(blackMoveIndex)}
              onContextMenu={(event) =>
                show({ event, props: { color: 'black' } })
              }
            >
              {blackMove.san}
            </Text>
          ) : (
            <div className="flex-1" />
          )}
        </div>
        {whiteMove.branchedHistories && (
          <NestedHistories
            branchedHistories={whiteMove.branchedHistories}
            historyIndex={[historyTurnIndex, 0]}
            onFocus={onFocus}
            onDelete={onDelete}
            className="pl-2 mt-2 border-l border-slate-500 ml-1 sbg-red-500"
            rowClassName={containerClassName}
            focusedRecursiveIndexes={focusedNestedIndex}
          />
        )}
        {blackMove?.branchedHistories && (
          <NestedHistories
            branchedHistories={blackMove.branchedHistories}
            historyIndex={[historyTurnIndex, 1]}
            onFocus={onFocus}
            onDelete={onDelete}
            className="pl-2 mt-2 border-l border-slate-500 ml-1 sbg-blue-500"
            rowClassName={containerClassName}
            focusedRecursiveIndexes={focusedNestedIndex}
          />
        )}
      </div>
    );
  }
);
