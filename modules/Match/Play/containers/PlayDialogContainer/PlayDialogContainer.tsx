import { useCallback } from 'react';
import { GameOffer } from '@/modules/Game';
import { PlayDialog } from './PlayDialog';
import { usePlayActionsDispatch } from '../../hooks';

export type PlayDialogContainerContainerProps = {
  inviteLink: string | undefined;
};

export const PlayDialogContainer = ({
  inviteLink,
}: PlayDialogContainerContainerProps) => {
  const dispatch = usePlayActionsDispatch();

  const onAcceptOffer = useCallback(
    ({ offer }: { offer: GameOffer['type'] }) => {
      if (offer === 'draw') {
        dispatch({ type: 'play:acceptOfferDraw' });
      } else if (offer === 'rematch') {
        dispatch({ type: 'play:acceptOfferRematch' });
      } else if (offer === 'takeback') {
        dispatch({ type: 'play:acceptTakeBack' });
      }
    },
    [dispatch]
  );

  return (
    <PlayDialog
      onAcceptOffer={onAcceptOffer}
      onCancelOffer={() => dispatch({ type: 'play:cancelOffer' })}
      onDenyOffer={() => dispatch({ type: 'play:denyOffer' })}
      inviteLink={inviteLink}
    />
  );
};
