import { ChessColor } from '@/lib/ChessRouler';
import { OngoingGame } from '@/modules/Game';

export const calculateTimeLeftAt = ({
  at,
  turn,
  prevTimeLeft,
}: {
  at: number;
  turn: ChessColor;
  prevTimeLeft: OngoingGame['timeLeft'];
}): OngoingGame['timeLeft'] => {
  const timeSince = at - prevTimeLeft.lastUpdatedAt;
  const nextTimeLeftForTurn = prevTimeLeft[turn] - timeSince;

  return {
    ...prevTimeLeft,
    [turn]: nextTimeLeftForTurn > 0 ? nextTimeLeftForTurn : 0,

    // Only update this if actually it is different
    ...(nextTimeLeftForTurn !== prevTimeLeft[turn] && {
      lastUpdatedAt: at,
    }),
  };
};
