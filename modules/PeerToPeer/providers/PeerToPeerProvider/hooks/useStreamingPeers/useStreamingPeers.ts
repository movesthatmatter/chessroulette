import { useCallback, useEffect, useMemo, useReducer } from 'react';
import {
  reducer,
  initialState,
  initAction,
  focusAction,
  updateAction,
} from './reducer';
import {
  PeersMap,
  StreamingPeer,
  StreamingPeersMap,
  isStreamingPeer,
} from '../../type';

type Props = {
  peersMap: PeersMap;
  focusedUserId?: StreamingPeer['userId'];
};

// TODO: This shouldn't be here!
// TODO: This might not actually need the Focus logic!
export const useStreamingPeers = ({ peersMap, focusedUserId }: Props) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const streamersMap = useMemo(() => {
    return Object.values(peersMap).reduce((prev, next) => {
      if (!isStreamingPeer(next)) {
        return prev;
      }

      return {
        ...prev,
        [next.userId]: next,
      };
    }, {} as StreamingPeersMap);
  }, [peersMap]);

  useEffect(() => {
    dispatch(
      initAction({
        streamersMap,
        focusedUserId,
      })
    );
  }, [streamersMap, focusedUserId]);

  useEffect(() => {
    dispatch(updateAction({ streamersMap }));
  }, [streamersMap]);

  useEffect(() => {
    if (focusedUserId) {
      dispatch(focusAction({ userId: focusedUserId }));
    }
  }, [focusedUserId]);

  const onFocus = useCallback(
    (userId: string) => {
      if (state.ready) {
        dispatch(focusAction({ userId }));
      }
    },
    [state.ready]
  );

  return { state, onFocus };
};
