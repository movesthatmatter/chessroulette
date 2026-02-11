import { MatchActions, MatchState } from '@/modules/Match/movex';

export type MatchActivityActivityState = MatchState;

export type MatchActivityState = {
  activityType: 'match';
  activityState: MatchActivityActivityState;
};

export type MatchActivityActions = MatchActions;
