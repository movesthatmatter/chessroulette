import { isRight } from 'fp-ts/lib/Either';
import * as io from 'io-ts';
import * as isoIO from './ISODateType';


describe('RecordIO ISODate Types', () => {
  describe('ISODate Type', () => {
    test('it works with ISODate (2019-10-31) input', () => {
      const r = io.type({
        date: isoIO.isoDate,
      });

      const actual = r.decode({
        date: '2019-09-21',
      });

      expect(isRight(actual)).toBe(true);
    });

    test('it does NOT work with ISOString (2019-10-31T00:16:59.998Z) input', () => {
      const r = io.type({
        date: isoIO.isoDate,
      });

      const actual = r.decode({
        date: '2019-10-31T00:16:59.998Z',
      });

      expect(isRight(actual)).toBe(false);
    });

    test('it does NOT work with timestamp input', () => {
      const r = io.type({
        date: isoIO.isoDate,
      });

      const actual = r.decode({
        date: 1572482531929,
      });

      expect(isRight(actual)).toBe(false);
    });

    test('it does NOT work with any other input', () => {
      const r = io.type({
        date: isoIO.isoDate,
      });

      const actual = r.decode({
        date: 'asd',
      });

      expect(isRight(actual)).toBe(false);
    });
  });


  describe('ISODateFromISOString', () => {
    test('works with ISOString (2019-10-31T00:16:59.998Z) input', () => {
      const r = io.type({
        date: isoIO.isoDateFromISOString,
      });

      const actual = r.decode({
        date: '2019-10-31T00:16:59.998Z',
      });

      expect(isRight(actual)).toBe(true);
      expect(isRight(actual) && actual.right.date).toBe('2019-10-31');
    });

    test('work with ISODates too (2019-10-23)', () => {
      const r = io.type({
        date: isoIO.isoDateFromISOString,
      });

      const actual = r.decode({
        date: '2019-01-31',
      });

      expect(isRight(actual)).toBe(true);
    });

    describe('it does NOT work with Bad ISOStrings', () => {
      test('Bad Month', () => {
        const r = io.type({
          date: isoIO.isoDateFromISOString,
        });

        const actual = r.decode({
        // Bad month
          date: '2019-00-31T00:16:59.998Z',
        });

        expect(isRight(actual)).toBe(false);
      });

      test('No Time delimitation', () => {
        const r = io.type({
          date: isoIO.isoDateFromISOString,
        });

        const actual = r.decode({
          date: '2019-00-3100:16:59.998Z',
        });

        expect(isRight(actual)).toBe(false);
      });
    });

    describe('TimeZones', () => {
      test('it does NOT change timezone based on local zone', () => {
        const r = io.type({
          date: isoIO.isoDateFromISOString,
        });

        const actual = r.decode({
          date: '2019-10-31T23:59:59.998Z',
        });

        expect(isRight(actual)).toBe(true);
        expect(isRight(actual) && actual.right.date).toBe('2019-10-31');
      });

      test('it does NOT change timezone based on local zone even without the Z', () => {
        const r = io.type({
          date: isoIO.isoDateFromISOString,
        });

        const actual = r.decode({
          date: '2019-10-31T23:59:59.998',
        });

        expect(isRight(actual)).toBe(true);
        expect(isRight(actual) && actual.right.date).toBe('2019-10-31');
      });
    });

    describe('ISODateFromUnixTime', () => {
      test('works with a valid Unix timestamp', () => {
        const r = io.type({
          date: isoIO.isoDateFromUnixTime,
        });

        const actual = r.decode({
          date: 1572485597,
        });

        expect(isRight(actual)).toBe(true);
        expect(isRight(actual) && actual.right.date).toBe('2019-10-31');
      });

      test('does not change the Timezone before', () => {
        const r = io.type({
          date: isoIO.isoDateFromUnixTime,
        });

        const actual = r.decode({
        // 2019-11-01T00:01:01.000Z
          date: 1572566461,
        });

        expect(isRight(actual)).toBe(true);
        expect(isRight(actual) && actual.right.date).toBe('2019-11-01');
      });

      test('does not change the Timezone after', () => {
        const r = io.type({
          date: isoIO.isoDateFromUnixTime,
        });

        const actual = r.decode({
        // 2019-10-31T23:59:59.000Z
          date: 1572566399,
        });

        expect(isRight(actual)).toBe(true);
        expect(isRight(actual) && actual.right.date).toBe('2019-10-31');
      });
    });
  });
});
