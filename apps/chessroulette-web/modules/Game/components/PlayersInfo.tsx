import { ChessColor } from '@xmatter/util-kit';
import { PlayerBox } from './PlayerBox';
// import { Game } from '../movex';
import {  Game } from '../types';
import { Old_Play_Results, PlayersBySide } from '@app/modules/Match/Play';

export type PlayersInfoProps = {
  players: PlayersBySide;
  turn: ChessColor;
  game: Game;
  onCheckTime: () => void;
  gameCounterActive: boolean;
  results: Old_Play_Results;
};

export const PlayersInfo = ({
  players,
  game,
  results,
  gameCounterActive,
  turn,
  onCheckTime,
}: PlayersInfoProps) => {
  return (
    <div className="flex flex-1 gap-1 flex-col">
      {/* {game.timeLeft[players.away.color]}ms left */}
      <PlayerBox
        key="away"
        playerInfo={players.away}
        score={results[players.away.color]}
        isActive={
          gameCounterActive &&
          game.status === 'ongoing' &&
          turn === players.away.color
        }
        gameTimeClass={game.timeClass}
        timeLeft={game.timeLeft[players.away.color]}
        onCheckTime={onCheckTime}
      />
      {/* {game.timeLeft[players.home.color]}ms left */}
      <PlayerBox
        key="home"
        playerInfo={players.home}
        score={results[players.home.color]}
        isActive={
          gameCounterActive &&
          game.status === 'ongoing' &&
          turn === players.home.color
        }
        gameTimeClass={game.timeClass}
        timeLeft={game.timeLeft[players.home.color]}
        onCheckTime={onCheckTime}
      />
    </div>
  );
};