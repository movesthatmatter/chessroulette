import { isValidISODateTime, toISODateTime } from './ISODateTime';

describe('ISO DateTime isValid', () => {
  test('a valid ISO date time string', () => {
    expect(isValidISODateTime('2019-11-06T03:45:59.611Z')).toBe(true);
  });

  test('valid if missing date time zone', () => {
    expect(isValidISODateTime('2019-11-06T03:45:59.611')).toBe(true);
  });

  test('invalid if missing time', () => {
    expect(isValidISODateTime('2019-11-06')).toBe(false);
  });

  test('invalid if missing date', () => {
    expect(isValidISODateTime('03:45:59.611')).toBe(false);
  });

  test('invalid if random string', () => {
    expect(isValidISODateTime('asd')).toBe(false);
  });

  test('invalid if invalid month day combination', () => {
    expect(isValidISODateTime('2019-02-30T03:45:59.611')).toBe(false);
  });

  test('invalid ISO Basic format (no seperators)', () => {
    expect(isValidISODateTime('20191106T034559611Z')).toBe(false);
  });
});

describe('ISO DateTime toISODateTime', () => {
  test('a Date Object', () => {
    expect(toISODateTime(new Date(1571865848345))).toBe('2019-10-23T21:24:08.345Z');
  });

  test('a valid ISODateTime string', () => {
    expect(toISODateTime('2019-10-23T21:24:08.345Z')).toBe('2019-10-23T21:24:08.345Z');
  });

  test('an invalid string', () => {
    expect(() => toISODateTime('20190223')).toThrow();
  });

  test('a valid ISODate', () => {
    expect(() => toISODateTime('2019-10-23')).toThrow();
  });

  test('maintains the UTC Timezone not the local one', () => {
    expect(toISODateTime(new Date('Tue Dec 31 2019 19:00:00 GMT-0500'))).toBe('2020-01-01T00:00:00.000Z');
  });
});
