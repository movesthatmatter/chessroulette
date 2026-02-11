import { useMemo, useState } from 'react';
import { ChessColor, areColorsEqual } from '@/lib/ChessRouler';
import { now } from '@/lib/time';
import { IdlingGame } from '@/modules/Game';
import { GameAbort, GameAbortViewProps } from './MatchAbort';
import { useMatchActionsDispatch } from '../../hooks';
import { PlayersByColor } from '../../Play';

type Props = Pick<GameAbortViewProps, 'className'> & {
  playersByColor: PlayersByColor;
  timeToAbortMs: number;
  game: IdlingGame;
  turn: ChessColor;
  completedPlaysCount: number;
  playerId?: string;
};

export const MatchAbortContainer = ({
  // players,
  playersByColor,
  timeToAbortMs,
  game,
  completedPlaysCount,
  playerId,
  turn,
  ...gameAbortViewProps
}: Props) => {
  const dispatch = useMatchActionsDispatch();

  const isMyTurn = useMemo(
    () =>
      (playersByColor.b.id === playerId && areColorsEqual(turn, 'b')) ||
      (playersByColor.w.id === playerId && areColorsEqual(turn, 'w')),
    [turn, playersByColor]
  );

  const firstRound = useMemo(
    () => completedPlaysCount < 1,
    [completedPlaysCount]
  );

  const calculateTimeLeft = () => {
    // If it's white's turn there is no lastMoveAt so it needs to use game.startedAt
    const lastGameActionAt = game.lastMoveAt || game.startedAt;

    return timeToAbortMs - (now() - lastGameActionAt);
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  return (
    <GameAbort
      {...gameAbortViewProps}
      onRefreshTimeLeft={() => {
        setTimeLeft(calculateTimeLeft());
      }}
      onAbort={() => {
        dispatch({
          type: 'play:abortGame',
          payload: { color: turn },
        });
      }}
      confirmContent={
        <div className="flex flex-row justify-center">
          <div>
            {firstRound
              ? 'If you abort, this match will be canceled and invalid!'
              : 'Be careful. If you Abort, you will lose the whole match!'}
          </div>
        </div>
      }
      canAbortOnDemand={isMyTurn}
      timeLeft={timeLeft}
    />
  );
};
