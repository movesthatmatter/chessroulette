import {
  DispatchOf,
  DistributivePick,
  swapColor,
  toShortColor,
} from '@xmatter/util-kit';
import type { PlayActions } from '../movex';
import { Playboard } from '@app/components/Boards';
import { useMemo } from 'react';
import { ChessboardContainerProps } from '@app/components/Chessboard';
import { Game } from '@app/modules/Game';
import { useGame } from '@app/modules/Game/hooks';
// import { useGame } from '../hooks';

export type GameBoardContainerProps = {
  boardSizePx: number;
  game: Game;
  canPlay: boolean;
  dispatch: DispatchOf<PlayActions>;
  isBoardFlipped?: boolean;
} & DistributivePick<
  ChessboardContainerProps,
  | 'overlayComponent'
  | 'rightSideSizePx'
  | 'rightSideClassName'
  | 'rightSideComponent'
>;

/**
 * Depends on the GameProvider
 */
export const GameBoardContainer = ({
  game,
  isBoardFlipped,
  boardSizePx,
  overlayComponent,
  canPlay,
  dispatch,
  ...boardProps
}: GameBoardContainerProps) => {
  // TODO: This should come from somewhere else
  const orientation = useMemo(
    () =>
      toShortColor(
        isBoardFlipped ? swapColor(game.orientation) : game.orientation
      ),
    [isBoardFlipped, game.orientation]
  );

  const {
    displayState,
    realState: { turn },
  } = useGame();

  return (
    <Playboard
      sizePx={boardSizePx}
      turn={toShortColor(turn)}
      fen={displayState.fen}
      lastMove={displayState.lastMove}
      canPlay={canPlay}
      overlayComponent={overlayComponent}
      playingColor={orientation}
      onMove={(payload) => {
        dispatch((masterContext) => ({
          type: 'play:move',
          payload: {
            ...payload,
            moveAt: masterContext.requestAt(),
          },
        }));

        // TODO: This can be returned from a more internal component
        return true;
      }}
      {...boardProps}
      // TODO: Move this into the Play Acticity or somewhere inside the Room only
      // rightSideSizePx={RIGHT_SIDE_SIZE_PX}
      // rightSideClassName="flex flex-col"
      // rightSideComponent={
      //   <>
      //     <div className="flex-1" />
      //     <div className="relative flex flex-col items-center justify-center">
      //       <PanelResizeHandle
      //         className="w-1 h-20 rounded-lg bg-slate-600"
      //         title="Resize"
      //       />
      //     </div>
      //     <div className="flex-1" />
      //   </>
      // }
    />
  );
};