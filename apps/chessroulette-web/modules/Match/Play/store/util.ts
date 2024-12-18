import { OngoingGame } from '@app/modules/Game';
import { LongChessColor } from '@xmatter/util-kit';

export const calculateTimeLeftAt = ({
  at,
  turn,
  prevTimeLeft,
}: {
  at: number;
  turn: LongChessColor;
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
