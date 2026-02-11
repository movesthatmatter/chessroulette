import {
  hours,
  minutes,
  second,
  milliseconds,
} from '@/lib/time';

export const lpad = function (digit: number, length = 2, padding = '0') {
  let res = String(digit);
  while (res.length < length) {
    res = padding + res;
  }
  return res;
};

export const timeLeftToTimeUnits = (durationMs: number) => {
  let seconds = durationMs / 1000;
  let minutes = Math.floor(seconds / 60);
  let hours = 0;

  if (minutes > 59) {
    hours = Math.floor(minutes / 60);
    minutes = minutes - hours * 60;
  }

  seconds = Math.floor(seconds % 60);

  return {
    hours,
    minutes,
    seconds,
  };
};

export const timeLeftToIntervalMs = (timeLeftMs: number) => {
  if (timeLeftMs < minutes(1)) {
    return milliseconds(10);
  }

  if (timeLeftMs < hours(1)) {
    return milliseconds(100);
  }

  return second();
};
