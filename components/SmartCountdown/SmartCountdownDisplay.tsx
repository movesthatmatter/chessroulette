import { Text } from '@/components/Text';

export type SmartCountdownDisplayProps = {
  timeLeft: number;
  active: boolean;
  major: string;
  minor: string;
  activeTextClassName?: string;
  inactiveTextClassName?: string;
};

export const SmartCountdownDisplay = ({
  timeLeft,
  major,
  minor,
  active,
  activeTextClassName = 'text-white',
  inactiveTextClassName = 'text-slate-400',
}: SmartCountdownDisplayProps) => {
  if (timeLeft <= 0) {
    return <Text className="text-red-500">00:00</Text>;
  }

  const shouldAlert = Number(major) < 1 && Number(minor) < 30;

  return (
    <Text className={active ? activeTextClassName : inactiveTextClassName}>
      <Text className="font-bold">{major}</Text>
      <Text>:</Text>
      <Text
        className={`font-thin ${
          shouldAlert ? 'text-red-500 animate-pulse' : ''
        }`}
      >
        {minor}
      </Text>
    </Text>
  );
};
