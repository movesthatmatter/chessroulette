import { Text } from 'apps/chessroulette-web/components/Text';
import { PlayersInfoContainer } from 'apps/chessroulette-web/modules/Play/PlayersInfoContainer';
import { useMatch } from 'apps/chessroulette-web/modules/room/activities/Match/providers/useMatch';
import {
  PlayersBySide,
  gameTimeClassRecord,
} from 'apps/chessroulette-web/modules/Play/types';
import React, { useMemo } from 'react';
import { useGame } from 'apps/chessroulette-web/modules/Play/providers/useGame';
import { DispatchOf, toLongColor } from '@xmatter/util-kit';
import { PlayActions } from 'apps/chessroulette-web/modules/Play/store';
import { getMovesDetailsFromPGN } from '../utils';
import { GameAbortContainer } from 'apps/chessroulette-web/modules/Play/GameAbortContainer';
import { MATCH_TIME_TO_ABORT } from '../movex';

type Props = {
  playersBySide: PlayersBySide;
  dispatch: DispatchOf<PlayActions>;
};

export const MatchStateDisplay: React.FC<Props> = ({
  dispatch,
  playersBySide,
}) => {
  const { rounds, currentRound, type, results, draws, players } = useMatch();
  const { realState } = useGame();

  const isGameCounterActive = useMemo(() => {
    const moves = getMovesDetailsFromPGN(realState.game.pgn);
    if (realState.game.status !== 'ongoing') {
      return false;
    }

    if (moves.totalMoves > 1) {
      return true;
    }

    return !!(
      moves.totalMoves === 1 &&
      moves.lastMoveBy &&
      toLongColor(moves.lastMoveBy) === 'black'
    );
  }, [realState.game.status, realState.game.pgn]);

  return (
    <div className="flex flex-col gap-2">
      {type === 'bestOf' && (
        <div className="flex flex-row gap-2 w-full">
          <Text>Round</Text>
          <Text>{`${currentRound}/${rounds}`}</Text>
          {draws > 0 && <Text>{`(${draws} games ended in draw)`}</Text>}
        </div>
      )}
      <div className="flex flex-row w-full">
        <PlayersInfoContainer
          key={realState.game.startedAt} // refresh it on each new game
          gameCounterActive={isGameCounterActive}
          players={playersBySide}
          results={results}
          onTimerFinished={(side) => {
            dispatch({
              type: 'play:timeout',
              payload: {
                color: playersBySide[side].color,
              },
            });
          }}
        />
      </div>
      {players && (
        <GameAbortContainer
          key={realState.game.startedAt} // refresh it on each new game
          players={players}
          dispatch={dispatch}
          className="bg-slate-700 rounded-md p-2"
          timeToAbortMs={MATCH_TIME_TO_ABORT}
        />
      )}
    </div>
  );
};