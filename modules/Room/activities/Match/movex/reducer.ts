import { MovexReducer } from 'movex-core-util';
import { ActivityActions, type ActivityState } from '../../movex';
import { initialMatchActivityState } from './state';
import * as MatchStore from '@/modules/Match/movex';

export const reducer: MovexReducer<ActivityState, ActivityActions> = (
  prev: ActivityState = initialMatchActivityState,
  action: ActivityActions
): ActivityState => {
  if (prev.activityType === 'match') {
    return {
      ...prev,
      activityState: MatchStore.reducer(
        prev.activityState,
        action as MatchStore.MatchActions
      ),
    };
  }
  return prev;
};

if (MatchStore.reducer.$transformState) {
  const matchStateTransformer = MatchStore.reducer.$transformState;

  reducer.$transformState = (state, masterContext): ActivityState => {
    if (state.activityType === 'match') {
      return {
        ...state,
        activityState: matchStateTransformer(
          state.activityState,
          masterContext
        ),
      };
    }

    return state;
  };
}
