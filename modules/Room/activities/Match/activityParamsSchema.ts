import { createMatchParamsSchema } from '@/modules/Match/movex';
import z from 'zod';

export const matchActivityParamsSchema = createMatchParamsSchema;

export type MatchActivityParamsSchema = z.TypeOf<
  typeof matchActivityParamsSchema
>;
