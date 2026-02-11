import { isValid, parseISO } from 'date-fns';

enum ISODateTimeBrand { _ = ''}

export type ISODateTime = ISODateTimeBrand & string;

// Stolen from this Stack Overflow Answer:
// https://stackoverflow.com/a/37563868/2093626
// This validates time not only dates as most of the other libraries
const ISO8601FullRegex = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(([+-]\d\d:\d\d)|Z)?$/i;

export const isValidISODateTime = (s: string): s is ISODateTime =>
  s.match(ISO8601FullRegex) !== null && isValid(parseISO(s));

export const toISODateTime = (d: Date | string): ISODateTime => {
  if (typeof d === 'string') {
    if (isValidISODateTime(d)) {
      return d;
    }

    throw new Error(`toValidISOString() Invalid String Error: ${d}`);
  }

  const generatedISOString = d.toISOString();

  if (!isValidISODateTime(generatedISOString)) {
    throw new Error(`toValidISOString() Invalid Date Error: ${d}`);
  }

  return generatedISOString as ISODateTime;
};
