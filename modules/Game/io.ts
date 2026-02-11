import z from 'zod';

export const gameTimeClassRecord = z.union([
  z.literal('blitz3'),
  z.literal('blitz'),
  z.literal('rapid'),
  z.literal('untimed'),
  z.literal('bullet'),
]);

export type GameTimeClass = z.infer<typeof gameTimeClassRecord>;
