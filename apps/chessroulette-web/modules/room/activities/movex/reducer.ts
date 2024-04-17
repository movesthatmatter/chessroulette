// The composition of all activity reducers

import * as LearnActivity from '../Learn/movex';
import { initialActivityState } from './state';
import { ActivityActions, ActivityState } from './types';
import * as MeetupActivity from '../Meetup/movex';
import * as PlayActivity from '../Play/movex';

export const roomActivityReducer = (
  state: ActivityState = initialActivityState,
  action: ActivityActions
): ActivityState => {
  // Return Use a composer function
  return PlayActivity.reducer(
    MeetupActivity.reducer(LearnActivity.reducer(state, action), action),
    action
  );

  // return prev;
};
