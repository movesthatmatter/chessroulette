import { MeetupActions, MeetupState } from '@/modules/Meetup/movex';

export type MeetupActivityState = {
  activityType: 'meetup';
  activityState: MeetupState;
};

export type MeetupActivityActions = MeetupActions;
