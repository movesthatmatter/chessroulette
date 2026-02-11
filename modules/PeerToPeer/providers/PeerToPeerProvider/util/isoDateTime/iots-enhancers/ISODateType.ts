import * as io from 'io-ts';
import { either } from 'fp-ts/lib/Either';
import { parseISO } from 'date-fns';
import { DateFromUnixTime } from 'io-ts-types/lib/DateFromUnixTime';
import {
  toISODateTime,
  ISODateTime as ISODateTimeType,
} from '../ISODateTime';
import {
  isValidISODate,
  toISODate,
  ISODate as ISODateType,
} from '../ISODate';

/**
 * Accepts input as 2011-09-21!
 */
export const isoDate = new io.Type<ISODateType, string, unknown>(
  'ISODate',
  (u): u is ISODateType => io.string.is(u) && isValidISODate(u),
  (u, c) => either.chain(io.string.validate(u, c), (s) => {
    try {
      return io.success(toISODate(s));
    } catch (e) {
      return io.failure(u, c);
    }
  }),
  String,
);

/**
 * Accepts input as 2019-10-31T00:16:59.998Z
 */
export const isoDateFromISOString = new io.Type<ISODateType, string, unknown>(
  'ISODateFromISOString',
  (u): u is ISODateType => io.string.is(u) && parseISO(u) instanceof Date,
  (u, c) => either.chain(io.string.validate(u, c), (s) => {
    try {
      return io.success(toISODate(s.slice(0, 10)));
    } catch (e) {
      return io.failure(u, c);
    }
  }),
  String,
);

export const isoDateTimeFromISOString = new io.Type<ISODateTimeType, string, unknown>(
  'ISODateTimeFromISOString',
  (u): u is ISODateTimeType => io.string.is(u) && parseISO(u) instanceof Date,
  (u, c) => either.chain(io.string.validate(u, c), (s) => {
    try {
      return io.success(toISODateTime(s));
    } catch (e) {
      return io.failure(u, c);
    }
  }),
  String,
);

/**
 * Accepts input as UnixTime
 */
export const isoDateFromUnixTime = new io.Type<ISODateType, number, unknown>(
  'ISODateFromUnixTime',
  (u): u is ISODateType => DateFromUnixTime.is(u),
  (u, c) => either.chain(io.number.validate(u, c), (n) => {
    try {
      const dateAsISOString = new Date(n * 1000).toISOString();

      return io.success(toISODate(dateAsISOString.slice(0, 10)));
    } catch (e) {
      return io.failure(u, c);
    }
  }),
  Number,
);
