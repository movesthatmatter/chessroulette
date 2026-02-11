'use client';

import { PanelResizeHandle } from 'react-resizable-panels';
import { DispatchOf, noop } from '@/lib/misc';
import { MatchContainer } from '@/modules/Match';
import type { UserId, UsersMap } from '@/modules/User';
import type { MatchActivityActions, MatchActivityState } from './movex';
import { RIGHT_SIDE_SIZE_PX } from '../../constants';
import { useRoomLinkId } from '../../hooks';
import { useMemo } from 'react';
import { populateMatchWithParticipants } from './utilts';

export type Props = {
  userId: UserId;
  participants: UsersMap;
  remoteState: NonNullable<MatchActivityState['activityState']>;
  dispatch?: DispatchOf<MatchActivityActions>;
};

export const MatchActivity = ({
  remoteState,
  dispatch,
  participants,
  ...props
}: Props) => {
  const { joinRoomLink } = useRoomLinkId('match');

  const populatedMatch = useMemo(
    () => populateMatchWithParticipants(remoteState, participants),
    [remoteState, participants],
  );

  return (
    <MatchContainer
      dispatch={dispatch || noop}
      match={populatedMatch}
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
