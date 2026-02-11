import { DispatchOf, DistributivePick } from '@/lib/misc';
import { GameNotationWidget } from '@/modules/Game/widgets';
import { UserId } from '@/modules/User';
import { ResizableDesktopLayout } from '@/templates/ResizableDesktopLayout';
import { PlayContainer, PlayerContainerProps } from './Play/PlayContainer';
import { MatchActions, MatchState } from './movex';
import { MatchProvider } from './providers';
import {
  MatchStateDialogContainer,
  MatchStateDisplayContainer,
} from './containers';
import { PlayControlsContainer } from './Play/containers';
import { PeerToPeerCameraWidget } from '../PeerToPeer';

type Props = DistributivePick<
  PlayerContainerProps,
  'rightSideClassName' | 'rightSideComponent' | 'rightSideSizePx'
> & {
  rightSideSizePx: NonNullable<PlayerContainerProps['rightSideSizePx']>; // re-enforcing this
  match: NonNullable<MatchState>;
  userId: UserId;
  dispatch: DispatchOf<MatchActions>;
  inviteLink?: string;
};

export const MatchContainer = ({
  match,
  userId,
  inviteLink,
  dispatch,
  ...boardProps
}: Props) => (
  <MatchProvider match={match} userId={userId} dispatch={dispatch}>
    <ResizableDesktopLayout
      mainComponent={({ boardSize }) => (
        <PlayContainer
          // This resets the PlayContainer on each new game
          key={match.endedGames.length}
          sizePx={boardSize}
          overlayComponent={
            <MatchStateDialogContainer inviteLink={inviteLink} />
          }
          {...boardProps}
        />
      )}
      rightSideSize={boardProps.rightSideSizePx}
      rightComponent={
        <div className="flex flex-col flex-1 min-h-0 gap-4">
          <div className="overflow-hidden rounded-lg shadow-2xl">
            <PeerToPeerCameraWidget />
          </div>
          <MatchStateDisplayContainer />
          <div className="bg-slate-700 p-3 flex flex-col gap-2 flex-1 min-h-0 rounded-lg shadow-2xl overflow-y-scroll">
            <GameNotationWidget />
            <PlayControlsContainer />
          </div>
        </div>
      }
    />
  </MatchProvider>
);
