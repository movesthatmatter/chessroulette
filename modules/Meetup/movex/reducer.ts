import { MovexReducer } from 'movex-core-util';
import { invoke, toDictIndexedBy } from '@/lib/misc';
import * as MatchStore from '@/modules/Match/movex';
import { MeetupActions, MeetupState } from './types';
import { initialMeetupState } from './state';

export const reducer: MovexReducer<MeetupState, MeetupActions> = (
  prev: MeetupState = initialMeetupState,
  action: MeetupActions
): MeetupState => {
  if (action.type === 'meetup:join') {
    const nextParticipantsById: MeetupState['participantsById'] = {
      ...prev.participantsById,
      [action.payload.userId]: {
        id: action.payload.userId,
        role: action.payload.isStar ? 'star' : 'fan',
      },
    };

    const nextMatch = prev.match
      ? prev.match
      : invoke(() => {
          const { fan, star } = toDictIndexedBy(
            Object.values(nextParticipantsById),
            (p) => p.role
          );

          // When both types of participants are present create a new match (if not already created)
          if (star && fan) {
            return MatchStore.createMatchState({
              type: 'openEnded',
              challengeeId: fan.id, // This is not in order, so it might take any of the fans (if multiple) but normally should not be multiple
              challengerId: star.id,
            });
          }

          return null;
        });

    if (action.payload.userId) {
      return {
        ...prev,
        participantsById: nextParticipantsById,
        match: nextMatch,
      };
    }
  }

  return {
    ...prev,
    match: MatchStore.reducer(prev.match, action as MatchStore.MatchActions),
  };
};

// TODO: This is where the reducerMapping could really shine! taking care of the $transformState as well
if (MatchStore.reducer.$transformState) {
  const matchStateTransformer = MatchStore.reducer.$transformState;

  reducer.$transformState = (state, masterContext): MeetupState => {
    return {
      ...state,
      match: matchStateTransformer(state.match, masterContext),
    };
  };
}
