'use client';

import { MovexBoundResourceFromConfig } from 'movex-react';
import { PanelResizeHandle } from 'react-resizable-panels';
import { noop } from '@/lib/misc';
import { UserId } from '@/modules/User';
import { MeetupContainer } from '@/modules/Meetup';
import movexConfig from '@/movex.config';
import { RIGHT_SIDE_SIZE_PX } from '../../constants';
import { MeetupActivityState } from './movex';
import { useRoomLinkId } from '../../hooks';

export type Props = {
  userId: UserId;
  remoteState: MeetupActivityState['activityState'];
  dispatch?: MovexBoundResourceFromConfig<
    (typeof movexConfig)['resources'],
    'room'
  >['dispatch'];
};

export const MeetupActivity = ({
  remoteState,
  dispatch: optionalDispatch,
  ...props
}: Props) => {
  const { joinRoomLink } = useRoomLinkId('meetup');

  const dispatch = optionalDispatch || noop;

  return (
    <MeetupContainer
      dispatch={dispatch || noop}
      match={remoteState.match}
      inviteLink={joinRoomLink}
      rightSideSizePx={RIGHT_SIDE_SIZE_PX}
      rightSideClassName="flex flex-col"
      rightSideComponent={
        <>
          <div className="flex-1" />
          <div className="relative flex flex-col items-center justify-center">
            <PanelResizeHandle
              className="w-1 h-20 rounded-lg bg-slate-600"
              title="Resize"
            />
          </div>
          <div className="flex-1" />
        </>
      }
      {...props}
    />
  );
};
