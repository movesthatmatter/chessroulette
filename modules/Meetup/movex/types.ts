import { MatchActions, MatchState } from '@/modules/Match/movex';
import { UserId } from '@/modules/User';
import { Action } from 'movex-core-util';

export type MeetupParticipant = {
  id: string;
  role: 'star' | 'fan';
};

export type MeetupState = {
  participantsById: Record<MeetupParticipant['id'], MeetupParticipant>;
  match: MatchState;
};

export type MeetupActions =
  | MatchActions
  | Action<'meetup:join', { userId: UserId; isStar?: boolean }>;

export type MeetupActivityActions = MeetupActions;
