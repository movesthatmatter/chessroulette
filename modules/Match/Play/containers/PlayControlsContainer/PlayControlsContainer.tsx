import { PlayControls } from './PlayControls';
import { useCurrentOrPrevMatchPlay, usePlayActionsDispatch } from '../../hooks';
import { PENDING_UNTIMED_GAME } from '@/modules/Game';

export const PlayControlsContainer = () => {
  const dispatch = usePlayActionsDispatch();
  const { lastOffer, game, playersBySide, hasGame } = useCurrentOrPrevMatchPlay();

  if (!hasGame) {
    return <>WARN| Play Controls Container No Game</>;
  }

  return (
    <PlayControls
      homeColor={playersBySide.home.color}
      playerId={playersBySide.home.id}
      onDrawOffer={() => {
        dispatch({
          type: 'play:sendOffer',
          // payload: { byPlayer: playerId, offerType: 'draw' },

          // TODO: left it here - this should be by color and that's it!
          payload: { byPlayer: playersBySide.home.id, offerType: 'draw' },
        });
      }}
      onTakebackOffer={() => {
        dispatch((masterContext) => ({
          type: 'play:sendOffer',
          payload: {
            byPlayer: playersBySide.home.id, // TODO: Change this to the player color instead since they are per game!
            offerType: 'takeback',
            timestamp: masterContext.requestAt(),
          },
        }));
      }}
      onResign={() => {
        dispatch({
          type: 'play:resignGame',
          payload: { color: playersBySide?.home.color },
        });
      }}
      game={game || PENDING_UNTIMED_GAME}
      lastOffer={lastOffer}
    />
  );
};
