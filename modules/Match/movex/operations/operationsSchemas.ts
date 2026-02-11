import { gameTimeClassRecord } from '@/modules/Game/io';
import { DistributiveOmit } from '@/lib/misc';
import z from 'zod';

// TODO: Move these from here in a more gernal place
export const whiteChessColorSchema = z.literal('white').or(z.literal('w'));
export const blackChessColorSchema = z.literal('black').or(z.literal('b'));
export const chessColorSchema = z.union([
  whiteChessColorSchema,
  blackChessColorSchema,
]);

export const createMatchParamsSchema = z.object({
  // This one is here in order not to copy the whole zod object inside the room
  // I prefer this alternative to having to maintain an exact copy of the whole object in both places
  // See https://github.com/colinhacks/zod/issues/2106 & https://github.com/colinhacks/zod/issues/2567
  //  on why Zod can't intersect and discriminate union at the same time, thus rendering this impossible!
  activity: z.literal('match'),
  type: z.union([
    z.literal('bestOf'), // BestOf = best out of N Rounds (e.g. 2 out of 3, 3 out of 5, etc...)
    z.literal('openEnded'), // This has no predefined rounds
  ]),
  // Rounds is only needed when "type" = "bestOf" and is an Odd Positive Number
  rounds: z.coerce.number().optional(),

  timeClass: gameTimeClassRecord.optional(),

  // Players
  challengerId: z.string(),
  challengeeId: z.string(),

  // This is the color of the challenger
  // If no color specified it's assigned randomly
  startColor: chessColorSchema.optional(),

  timeToAbortMs: z.coerce.number().optional(),
  breakDurationMs: z.coerce.number().optional(),
});

// Take out the unneeded 'activity' from Here
export type CreateMatchParamsSchema = DistributiveOmit<
  z.TypeOf<typeof createMatchParamsSchema>,
  'activity'
>;
