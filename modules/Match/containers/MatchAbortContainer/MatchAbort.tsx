import React from 'react';
import { ConfirmButton, ConfirmButtonProps } from '@/components/Button';
import { SmartCountdown } from '@/components/SmartCountdown';

export type GameAbortViewProps = {
  timeLeft: number;
  canAbortOnDemand: boolean;
  confirmContent: ConfirmButtonProps['confirmModalContent'];
  onAbort: () => void;
  onRefreshTimeLeft: () => void;
  className?: string;
};

export const GameAbort: React.FC<GameAbortViewProps> = ({
  timeLeft,
  canAbortOnDemand,
  className,
  confirmContent,
  onAbort,
  onRefreshTimeLeft,
}) => (
  <div className={`flex gap-3 flex-1 justify-between ${className}`}>
    <div className="flex gap-2">
      <span>{`Game aborting in `}</span>
      <SmartCountdown
        msLeft={timeLeft}
        onFinished={onAbort}
        onRefreshMsLeft={onRefreshTimeLeft}
        isActive
        activeTextClassName="text-red-500 font-bold"
      />
    </div>
    {canAbortOnDemand && (
      <ConfirmButton
        bgColor="red"
        size="sm"
        onClick={onAbort}
        icon="StopCircleIcon"
        iconKind="solid"
        confirmModalContent={confirmContent}
        confirmModalTitle="Are you sure?"
        confirmModalAgreeButtonBgColor="red"
      >
        Abort Now
      </ConfirmButton>
    )}
  </div>
);
