import { useState } from 'react';
import { SmartCountdown } from '@/components/SmartCountdown';
import { now } from '@/lib/time';

type Props = {
  startedAt: number;
  onFinished: () => void;
  totalTimeAllowedMs: number;
  className?: string;
};

const calculateTimeLeft = (totalTimeAllowedMs: number, fromTimestamp: number) =>
  totalTimeAllowedMs - (now() - fromTimestamp);

export const BetweenGamesAborter = ({
  startedAt,
  totalTimeAllowedMs,
  onFinished,
  className,
}: Props) => {
  const [timeLeft, setTimeLeft] = useState(
    calculateTimeLeft(totalTimeAllowedMs, startedAt)
  );

  return (
    <div className={`flex gap-1 ${className}`}>
      <span>Next game starting in</span>
      <SmartCountdown
        msLeft={timeLeft}
        isActive
        onFinished={onFinished}
        onRefreshMsLeft={() =>
          setTimeLeft(calculateTimeLeft(totalTimeAllowedMs, startedAt))
        }
      />
    </div>
  );
};
