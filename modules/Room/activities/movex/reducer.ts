import { composeReducers } from '@/lib/util';
import * as LearnActivity from '../Learn/movex';
import * as MeetupActivity from '../Meetup/movex';
import * as MatchActivity from '../Match/movex';

export const roomActivityReducer = composeReducers(
  LearnActivity.reducer,
  MeetupActivity.reducer,
  MatchActivity.reducer
);
