import React from 'react';
import { Text } from '@/components/Text';
import { PlayersInfo } from '@/modules/Match/Play/containers';
import { MatchAbortContainer } from '../MatchAbortContainer';
import {
  useMatchActionsDispatch,
  useMatchViewState,
} from '../../hooks/useMatch';
import { useCurrentOrPrevMatchPlay } from '../../Play/hooks';

export const MatchStateDisplayContainer = () => {
  const { match, currentRound, drawsCount, endedGamesCount } =
    useMatchViewState();
  const play = useCurrentOrPrevMatchPlay();

  const dispatch = useMatchActionsDispatch();

  return (
    <div className="flex flex-col gap-2">
      {match?.type === 'bestOf' && (
        <div className="flex flex-row gap-2 w-full">
          <Text>Round</Text>
          <Text>{`${currentRound}/${match.rounds}`}</Text>
          {drawsCount > 0 && (
            <Text>{`(${drawsCount} games ended in draw)`}</Text>
          )}
        </div>
      )}
      <div className="flex flex-row w-full">
        {play.game && (
          <PlayersInfo
            key={play.game.startedAt} // refresh it on each new game
            playersBySide={play.playersBySide}
            game={play.game}
            turn={play.turn}
            onCheckTime={() => {
              dispatch((masterContext) => ({
                type: 'play:checkTime',
                payload: {
                  at: masterContext.requestAt(),
                },
              }));
            }}
          />
        )}
      </div>
      {match && play.hasGame && play.game.status === 'idling' && (
        <MatchAbortContainer
          key={play.game.startedAt + play.turn} // refresh it on each new game & when the turn changes
          game={play.game}
          turn={play.turn}
          playersByColor={play.playersByColor}
          timeToAbortMs={match.timeToAbortMs}
          playerId={play.userAsPlayerId}
          completedPlaysCount={endedGamesCount}
          className="bg-slate-700 rounded-md p-2"
        />
      )}
    </div>
  );
};
