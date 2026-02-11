import { useMemo } from 'react';
import { getMovesDetailsFromPGN } from '@/modules/Match/utils';
import { ChessColor, areColorsEqual } from '@/lib/ChessRouler';
import { PlayerBox } from './PlayerBox';
import { PlayersBySideWithResults } from '../../types';
import { Game } from '@/modules/Game';

type Props = {
  game: Game;
  playersBySide: PlayersBySideWithResults;
  turn: ChessColor;
  onCheckTime: () => void;
};

export const PlayersInfo = ({
  game,
  playersBySide,
  turn,
  onCheckTime,
}: Props) => {
  const isGameCountdownActive = useMemo(() => {
    if (game.status !== 'ongoing') {
      return false;
    }

    const moves = getMovesDetailsFromPGN(game.pgn);

    if (moves.totalMoves > 1) {
      return true;
    }

    return !!(
      moves.totalMoves === 1 &&
      moves.lastMoveBy &&
      moves.lastMoveBy === 'b'
    );
  }, [game]);

  return (
    <div className="flex flex-1 gap-1 flex-col">
      <PlayerBox
        key="away"
        playerInfo={playersBySide.away}
        isActive={
          isGameCountdownActive &&
          areColorsEqual(turn, playersBySide.away.color)
        }
        gameTimeClass={game.timeClass}
        timeLeft={game.timeLeft[playersBySide.away.color]}
        onCheckTime={onCheckTime}
      />
      <PlayerBox
        key="home"
        playerInfo={playersBySide.home}
        isActive={
          isGameCountdownActive &&
          areColorsEqual(turn, playersBySide.home.color)
        }
        gameTimeClass={game.timeClass}
        timeLeft={game.timeLeft[playersBySide.home.color]}
        onCheckTime={onCheckTime}
      />
    </div>
  );
};
