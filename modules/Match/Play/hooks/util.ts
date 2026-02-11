import { Game } from '@/modules/Game';
import { UserId } from '@/modules/User';
import { PlayersByColor } from '../types';
import { isOneOf } from '@/lib/misc';

export type CanPlayParams = {
  game: Game;
  userId: UserId;
  playersByColor: PlayersByColor;
};

export const canUserPlay = ({
  playersByColor,
  userId,
  game,
}: CanPlayParams) => {
  // If the userId is not part of the players s/he cannot play
  if (!(playersByColor.w.id === userId || playersByColor.b.id === userId)) {
    return false;
  }

  if (isOneOf(game.status, ['complete', 'aborted'])) {
    return false;
  }

  if (game.status === 'ongoing') {
    return true;
  }

  // if Pending, can play only if both players are present
  const [playerA, playerB] = Object.keys(playersByColor);

  return !!(playerA && playerB);
};
