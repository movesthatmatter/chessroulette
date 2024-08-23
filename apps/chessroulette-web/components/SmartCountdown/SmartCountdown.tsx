import React, { useState, useEffect, useMemo } from 'react';
import { CountdownDisplay } from './Display';
import { useInterval } from 'apps/chessroulette-web/hooks/useInterval';
import { timeLeftToIntervalMs } from 'apps/chessroulette-web/modules/Play/lib';
import { lpad, timeLeftToTimeUnits } from './util';
import { noop } from '@xmatter/util-kit';

export type SmartCountdownProps = {
  msLeft: number;
  isActive: boolean;
  className?: string;
  onFinished?: () => void;
};

export const SmartCountdown = ({
  onFinished = noop,
  msLeft,
  isActive,
  className,
}: SmartCountdownProps) => {
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(msLeft);
  const [interval, setInterval] = useState(timeLeftToIntervalMs(msLeft));

  useEffect(() => {
    setTimeLeft(msLeft);
  }, [msLeft]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    if (timeLeft <= 0) {
      setFinished(true);
    } else {
      setInterval(timeLeftToIntervalMs(timeLeft));
    }
  }, [timeLeft]);

  useEffect(() => {
    if (finished) {
      onFinished();
    }
  }, [finished]);

  useInterval(
    () => {
      setTimeLeft((prev) => prev - interval);
    },
    finished || isActive ? interval : undefined
  );

  const { major, minor, canShowMilliseconds } = useMemo(() => {
    const times = timeLeftToTimeUnits(timeLeft);
    if (times.hours > 0) {
      return {
        major: `${times.hours}h`,
        minor: `${lpad(times.minutes)}`,
        canShowMilliseconds: false,
      };
    }
    return {
      major: lpad(times.minutes),
      minor: lpad(times.seconds),
      canShowMilliseconds: false,
    };
  }, [timeLeft]);

  return (
    <div className={className}>
      <CountdownDisplay
        major={major}
        minor={minor}
        active={isActive}
        timeLeft={timeLeft}
        canShowMilliseconds={canShowMilliseconds}
      />
    </div>
  );
};