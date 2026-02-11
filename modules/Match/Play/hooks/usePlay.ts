import { invoke } from '@/lib/misc';
import { getTurnFromPgn } from '@/modules/Game/lib';
import { Game } from '@/modules/Game';
import { useMatchViewState } from '../../hooks';
import { PlayViewState, PlayersByColor, PlayersBySide } from '../types';
import { canUserPlay } from './util';
import { MatchState } from '../../movex';
import { MatchViewState } from '../../types';
import { swapColor } from '@/lib/ChessFENBoard';

export const useCurrentMatchPlay = (): PlayViewState => {
  const { match, userAsPlayer } = useMatchViewState();

  if (!match?.gameInPlay) {
    return {
      hasGame: false,
    };
  }

  return getPlayFromGame(match?.gameInPlay, match, userAsPlayer);
};

export const useCurrentOrPrevMatchPlay = (): PlayViewState => {
  const { match, previousGame, userAsPlayer } = useMatchViewState();

  const game = match?.gameInPlay || previousGame;

  if (!(match && game)) {
    return {
      hasGame: false,
    };
  }

  return getPlayFromGame(game, match, userAsPlayer);
};

const getPlayFromGame = (
  game: Game,
  {
    challengee,
    challenger,
  }: Pick<NonNullable<MatchState>, 'challengee' | 'challenger'>,
  userAsPlayer: MatchViewState['userAsPlayer']
): PlayViewState => {
  const challengerColor = challenger.id === game.players.w ? 'w' : 'b';
  const challengeeColor = swapColor(challengerColor);

  const playersBySide: PlayersBySide = invoke(() => {
    if (userAsPlayer?.id === challengee.id) {
      return {
        home: {
          ...challengee,
          color: challengeeColor,
        },
        away: {
          ...challenger,
          color: challengerColor,
        },
      };
    }

    return {
      home: {
        ...challenger,
        color: challengerColor,
      },
      away: {
        ...challengee,
        color: challengeeColor,
      },
    };
  });

  const playersByColor: PlayersByColor = invoke(() =>
    challengerColor === 'w'
      ? {
          w: {
            ...challenger,
            color: 'w',
          },
          b: {
            ...challengee,
            color: 'b',
          },
        }
      : {
          w: {
            ...challengee,
            color: 'w',
          },
          b: {
            ...challenger,
            color: 'b',
          },
        }
  );

  return {
    hasGame: true,
    game: game,
    turn: getTurnFromPgn(game.pgn),
    playersByColor,
    playersBySide,
    ...invoke(() => {
      if (
        !!userAsPlayer &&
        canUserPlay({
          userId: userAsPlayer.id,
          playersByColor,
          game: game,
        })
      ) {
        return {
          canUserPlay: true,
          userAsPlayerId: userAsPlayer.id,
        };
      } else {
        return {
          canUserPlay: false,
          userAsPlayerId: undefined,
        };
      }
    }),
    lastOffer: game.offers?.slice(-1)[0],
  };
};
