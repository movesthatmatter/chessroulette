import {
  FBHIndex,
  FBHMove,
  FBHRecursiveBlackMove,
  FBHRecursiveWhiteMove,
  FreeBoardHistory,
} from '@/lib/FreeBoardHistory';
import { RowItem } from './RowItem';
import { MouseEvent } from 'react';
import { BlackShortColor, WhiteShortColor } from '@/lib/ChessRouler';

type Props = {
  rootHistoryIndex: FBHIndex;
  isFocused: boolean;
  onFocus: (index: FBHIndex) => void;
  onContextMenu: (event: MouseEvent) => void;
  nextValidMoveAndIndex?: [FBHMove, FBHIndex];
} & (
  | {
      color: WhiteShortColor;
      move: FBHRecursiveWhiteMove;
    }
  | {
      color: BlackShortColor;
      move?: FBHRecursiveBlackMove;
    }
);

// TODO: Make this part of the util
const constructNestedIndex = (
  nonRecursiveIndex: FBHIndex,
  nestedIndex: FBHIndex,
  paralelBranchIndex: number,
): FBHIndex => [
  nonRecursiveIndex[0],
  nonRecursiveIndex[1],
  [nestedIndex, paralelBranchIndex],
];

export const HistoryMove = ({
  move,
  onFocus,
  onContextMenu,
  isFocused,
  rootHistoryIndex,
  nextValidMoveAndIndex,
}: Props) => {
  if (!move) {
    return <div className="flex-1" />;
  }

  return (
    <RowItem
      san={move.san}
      isFocused={isFocused}
      onClick={() => onFocus(rootHistoryIndex)}
      onContextMenu={onContextMenu}
      variantMenu={
        isFocused && move.branchedHistories && move.branchedHistories.length > 0
          ? {
              items: [
                ...(nextValidMoveAndIndex
                  ? [
                      {
                        value: nextValidMoveAndIndex[0].san,
                        onSelect: () => {
                          onFocus(
                            nextValidMoveAndIndex[1],
                            // constructNestedIndex(rootHistoryIndex, nextIndex, i)
                          );
                        },
                      },
                    ]
                  : []),
                ...move.branchedHistories.map((h, i) => {
                  const nextIndex = FreeBoardHistory.findNextValidMoveIndex(
                    h,
                    FreeBoardHistory.getStartingIndex(),
                    'right',
                  );

                  return {
                    value:
                      FreeBoardHistory.findMoveAtIndex(h, nextIndex)?.san || '',
                    onSelect: () =>
                      onFocus(
                        constructNestedIndex(rootHistoryIndex, nextIndex, i),
                      ),
                  };
                }),
              ],
            }
          : undefined
      }
    />
  );
};
