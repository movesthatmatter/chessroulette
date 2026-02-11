import { useMemo } from 'react';
import { CanPlayParams, canUserPlay } from './util';

export const useCanPlay = (props: CanPlayParams) =>
  useMemo(
    () => canUserPlay(props),
    [props.game, props.playersByColor, props.userId]
  );
