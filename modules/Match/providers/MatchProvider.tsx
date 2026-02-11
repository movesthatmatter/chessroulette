import React, { PropsWithChildren, useMemo } from 'react';
import { MovexDispatchAction } from 'movex';
import { GameProvider } from '@/modules/Game/GameProvider';
import { PENDING_UNTIMED_GAME } from '@/modules/Game';
import { User } from '@/modules/User';
import { invoke } from '@/lib/misc';
import { MatchStateContext, MatchContextType } from './MatchContext';
import type { MatchActions, MatchState } from '../movex';

type Props = PropsWithChildren<{
  match: NonNullable<MatchState>;
  userId: User['id'];
  dispatch: MovexDispatchAction<MatchActions>;
}>;

export const MatchProvider: React.FC<Props> = ({
  match,
  userId,
  dispatch,
  children,
}) => {
  const contextState = useMemo<MatchContextType>(
    () => ({
      match,
      drawsCount: match.endedGames.filter((game) => game.winner === '1/2')
        .length,
      endedGamesCount: match.endedGames.length,
      currentRound:
        match.endedGames.filter((game) => game.winner !== '1/2').length + 1,
      previousGame: match.endedGames.slice(-1)[0],
      userAsPlayer: invoke(() => {
        if (userId === match.challengee.id) {
          return {
            id: userId,
            type: 'challengee',
          };
        }

        if (userId === match.challenger.id) {
          return {
            id: userId,
            type: 'challenger',
          };
        }

        return undefined;
      }),

      // // @deprecate
      // results: {
      //   white: match.players.white.points,
      //   black: match.players.black.points,
      // },

      results: {
        challengee: { points: match.challengee.points },
        challenger: { points: match.challenger.points },
      },
      dispatch,
    }),
    [match, userId, dispatch]
  );

  return (
    <MatchStateContext.Provider value={contextState}>
      <GameProvider
        game={
          contextState?.match?.gameInPlay ||
          contextState?.previousGame ||
          PENDING_UNTIMED_GAME
        }
        playerId={userId}
      >
        {children}
      </GameProvider>
    </MatchStateContext.Provider>
  );
};
