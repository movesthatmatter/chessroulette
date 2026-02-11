import { initialLearnActivityState } from '../Learn/movex';
import { initialMatchActivityState } from '../Match/movex';
import { initialMeetupActivityState } from '../Meetup/movex';
import { ActivityState } from './types';

export const initialNoneActivityState = {
  activityType: 'none',
  activityState: {},
} as const;

export const initialActivityState: ActivityState = initialNoneActivityState;

export const initialActivityStatesByActivityType: {
  [k in ActivityState['activityType']]: Extract<
    ActivityState,
    { activityType: k }
  >;
} = {
  none: initialNoneActivityState,
  learn: initialLearnActivityState,
  meetup: initialMeetupActivityState,
  match: initialMatchActivityState,
};
