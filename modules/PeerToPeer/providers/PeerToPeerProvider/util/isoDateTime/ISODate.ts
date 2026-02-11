import { parseISO, isValid } from 'date-fns';

// The ISO 8601 Date format
//  See https://en.wikipedia.org/wiki/ISO_8601

// This idea is 100% borrowed from this article:
//  https://spin.atomicobject.com/2017/06/19/strongly-typed-date-string-typescript/
// It works pretty nice o be able to take a string and brand with a nominal type!
// Also see https://basarat.gitbooks.io/typescript/docs/tips/nominalTyping.html
enum ISODateBrand { _ = '' }

/**
 * A String that represents Date w/o Time with this formt: yyyy-mm-dd
 */
export type ISODate = ISODateBrand & string;

/**
 * This function checks if the given string is of the ISO Format (yyyy-mm-dd)
 * and if the actual date is a valid one - i.e. not 2014-45-99 or even not 2014-02-31
 *
 * @param s
 */
export const isValidISODate = (s: string): s is ISODate =>
  s.match(/^\d{4}-\d{2}-\d{2}$/) !== null && isValid(parseISO(s));

/**
 * This maintains ISO Timezone
 *
 * @param date
 */
export function toISODate(date: Date | string): ISODate {
  if (typeof date === 'string') {
    if (isValidISODate(date)) {
      return date;
    }

    throw new Error(`toISODate() Invalid String Error: ${date}`);
  }

  const dateString = date.toISOString().slice(0, 10);

  if (isValidISODate(dateString)) {
    return dateString;
  }

  throw new Error(`toISODate() Invalid Date Error: ${date}`);
}

// By the same style we can export a few more helper types
enum ISOYearBrand { _ = ''}

/**
 * A String that represents Year with this formt: yyyy
 */
export type ISOYear = ISOYearBrand & string;

export const isValidISOYear = (s: string): s is ISOYear =>
  String(s).match(/^\d{4}$/) !== null;

/**
 * This maintains ISO Timezone
 *
 * @param date
 */
export function toISOYear(date: Date | ISODate | string): ISOYear {
  if (typeof date === 'string') {
    if (isValidISODate(date)) {
      // If it's a valid ISO Date just return the year portion
      return date.slice(0, 4) as ISOYear;
    }

    if (isValidISOYear(date)) {
      return date;
    }

    throw new Error(`isValidYearString() Invalid String Error: ${date}`);
  }

  // const dateString = String(date.getFullYear());
  const dateString = date.toISOString().slice(0, 4);

  if (isValidISOYear(dateString)) {
    return dateString;
  }

  throw new Error(`isValidDateString() Invalid Date Error: ${date}`);
}

// By the same style we can export a few more helper types
enum ISOMonthBrand { _ = ''}

/**
 * A String that represents Year with this formt: yyyy
 */
export type ISOMonth = ISOMonthBrand & string;

export const isValidISOMonth = (s: string): s is ISOMonth =>
  String(s).match(/^\d{2}$/) !== null && Number(s) > 0 && Number(s) < 13;

export function toISOMonth(date: Date | ISODate | string): ISOMonth {
  if (typeof date === 'string') {
    if (isValidISODate(date)) {
      // If it's a valid ISO Date just return the year portion
      return date.slice(5, 7) as ISOMonth;
    }

    if (isValidISOMonth(date)) {
      return date;
    }

    throw new Error(`toValidISOMonth() Invalid String Error: ${date}`);
  }

  const dateString = date.toISOString().slice(5, 7);

  if (isValidISOMonth(dateString)) {
    return dateString;
  }

  throw new Error(`toValidISOMonth() Invalid Date Error: ${date}`);
}
