import {
  toISODate, isValidISODate, isValidISOYear, toISOYear, isValidISOMonth, toISOMonth,
} from './ISODate';

describe('ISO Date', () => {
  describe('isValid', () => {
    test('a valid date this year', () => {
      expect(isValidISODate('2014-02-21')).toBe(true);
    });

    test('a year with 3 digits', () => {
      expect(isValidISODate('201-02-21')).toBe(false);
    });

    test('a year with 5 digits', () => {
      expect(isValidISODate('20102-02-21')).toBe(false);
    });

    test('an out of bound month', () => {
      expect(isValidISODate('2019-13-21')).toBe(false);
    });

    test('a 00 month', () => {
      expect(isValidISODate('2019-00-21')).toBe(false);
    });

    test('an out of bound day', () => {
      expect(isValidISODate('2019-01-32')).toBe(false);
    });

    test('a 00 day', () => {
      expect(isValidISODate('2019-01-00')).toBe(false);
    });

    test('an out of bound day of specific month', () => {
      expect(isValidISODate('2019-02-30')).toBe(false);
    });

    test('an out of bound day of specific month of a nonleap year', () => {
      expect(isValidISODate('2015-02-29')).toBe(false);
    });

    test('a normally out of bound day of specific month of leap year ', () => {
      expect(isValidISODate('2016-02-29')).toBe(true);
    });

    test('does NOT work with an ISOString (2019-10-31T00:16:59.998Z)', () => {
      expect(isValidISODate('2019-10-31T00:16:59.998Z')).toBe(false);
    });
  });

  describe('toISODate', () => {
    test('a Date Object', () => {
      expect(toISODate(new Date(1571865848345))).toBe('2019-10-23');
    });

    test('a valid string', () => {
      expect(toISODate('2019-02-23')).toBe('2019-02-23');
    });

    test('an invalid string', () => {
      expect(() => toISODate('20190223')).toThrow();
    });

    test('toISODate returns in UTC Timezone, not the local one!', () => {
      expect(toISODate(new Date('Mon Nov 04 2019 23:00:00 GMT-0500'))).toBe('2019-11-05');
    });
  });
});

describe('ISO Year', () => {
  describe('isValid', () => {
    test('a valid year', () => {
      expect(isValidISOYear('2014')).toBe(true);
    });

    test('a year with 5 digits', () => {
      expect(isValidISOYear('20142')).toBe(false);
    });

    test('a year with 3 digits', () => {
      expect(isValidISOYear('201')).toBe(false);
    });

    test('a year w/ digits and letters', () => {
      expect(isValidISOYear('2o12')).toBe(false);
    });

    test('fails with a valid ISODate', () => {
      expect(isValidISOYear('2012-01-22')).toBe(false);
    });
  });

  describe('toISOYear', () => {
    test('valid digits of format yyyy', () => {
      expect(toISOYear('2323')).toBe('2323');
    });

    test('valid ISODate', () => {
      expect(toISOYear('2323-02-12')).toBe('2323');
    });

    test('valid Date objecet', () => {
      expect(toISOYear(new Date(1571865848345))).toBe('2019');
    });

    test('digits too short', () => {
      expect(() => toISOYear('232')).toThrow();
    });

    test('digits too long', () => {
      expect(() => toISOYear('23223')).toThrow();
    });

    test('letters', () => {
      expect(() => toISOYear('asda')).toThrow();
    });

    test('invalid ISO Date', () => {
      expect(() => toISOYear('2012-01-00')).toThrow();
    });

    test('toISODate returns in UTC Timezone, not the local one!', () => {
      expect(toISOYear(new Date('Tue Dec 31 2019 20:00:00 GMT-0500'))).toBe('2020');
    });
  });
});

describe('ISO Month', () => {
  describe('isValid', () => {
    test('a valid month at upper boundary', () => {
      expect(isValidISOMonth('12')).toBe(true);
    });

    test('a valid month at lower boundary', () => {
      expect(isValidISOMonth('01')).toBe(true);
    });

    test('a valid month in the middle', () => {
      expect(isValidISOMonth('05')).toBe(true);
    });

    test('a month with 3 digits', () => {
      expect(isValidISOYear('123')).toBe(false);
    });

    test('a month with 1 digits', () => {
      expect(isValidISOYear('1')).toBe(false);
    });

    test('a month w/ digits and letters', () => {
      expect(isValidISOYear('1o')).toBe(false);
    });

    test('fails with a valid ISODate', () => {
      expect(isValidISOYear('2012-01-22')).toBe(false);
    });
  });

  describe('toISOYear', () => {
    test('valid digits of format mm', () => {
      expect(toISOMonth('12')).toBe('12');
    });

    test('valid ISODate', () => {
      expect(toISOMonth('2323-02-12')).toBe('02');
    });

    test('valid Date objecet', () => {
      expect(toISOMonth(new Date(1571865848345))).toBe('10');
    });

    test('digits too short', () => {
      expect(() => toISOMonth('1')).toThrow();
    });

    test('digits too long', () => {
      expect(() => toISOMonth('123')).toThrow();
    });

    test('letters', () => {
      expect(() => toISOMonth('asda')).toThrow();
    });

    test('invalid ISO Date', () => {
      expect(() => toISOMonth('2012-01-00')).toThrow();
    });

    test('toISODate returns in UTC Timezone, not the local one!', () => {
      expect(toISOMonth(new Date('Tue Dec 31 2019 20:00:00 GMT-0500'))).toBe('01');
    });
  });
});
