import * as io from 'io-ts';
import {
  type ISODate as ISODateType,
  isoDateTimeFromISOString,
  toISODate,
} from './util/isoDateTime';
import { parseISO } from 'date-fns';
import { either } from 'fp-ts/lib/Either';

/**
 * Accepts input as 2019-10-31T00:16:59.998Z
 */
export const isoDateFromISOString = new io.Type<ISODateType, string, unknown>(
  'ISODateFromISOString',
  (u): u is ISODateType => io.string.is(u) && parseISO(u) instanceof Date,
  (u, c) =>
    either.chain(io.string.validate(u, c), (s) => {
      try {
        return io.success(toISODate(s.slice(0, 10)));
      } catch (e) {
        return io.failure(u, c);
      }
    }),
  String
);

export const peerMessageEnvelope = io.type({
  // This stays unknown at this level
  message: io.unknown,

  timestamp: isoDateTimeFromISOString,
});
export type PeerMessageEnvelope<TMessage = unknown> = io.TypeOf<
  typeof peerMessageEnvelope
> & {
  message: TMessage;
};

export const peerUserRecord = io.type({
  id: io.string,
});

export const peerConnectionMetadata = io.type({
  user: peerUserRecord,
});
export type PeerConnectionMetadata = io.TypeOf<typeof peerConnectionMetadata>;
