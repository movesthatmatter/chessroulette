import {
  ActivityActions,
  ActivityState,
  initialActivityState,
} from '../../movex';
import * as PlayStore from '@app/modules/Play/movex';

export const reducer = (
  prev: ActivityState = initialActivityState,
  action: ActivityActions
): ActivityState => {
  if (prev.activityType === 'play') {
    return {
      ...prev,
      activityState: PlayStore.reducer(
        prev.activityState,
        action as PlayStore.PlayActions
      ),
    };
  }

  return prev;
};
