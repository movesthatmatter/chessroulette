// import fastDeepEquals from 'fast-deep-equal/es6';

import { DistributiveOmit } from './miscType';

// import { DistributiveOmit } from './miscType';

/**
 * https://stackoverflow.com/questions/1527803/generating-random-whole-numbers-in-javascript-in-a-specific-range
 *
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 */
export function getRandomInt(givenMin: number, givenMax: number) {
  const min = Math.ceil(givenMin);
  const max = Math.floor(givenMax);

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const _alphabet =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
export const getRandomStr = (N: number = 6) =>
  Array(N)
    .join()
    .split(',')
    .map(function () {
      return _alphabet.charAt(Math.floor(Math.random() * _alphabet.length));
    })
    .join('');

export const generateUserId = () => getRandomStr(5);
export const generateGuestUserId = () => `guest-${getRandomStr(9)}`;

export const noop = (..._: any[]) => {};

export const flatten = <T>(a: T[]) =>
  a.reduce((accumulator, value) => accumulator.concat(value), [] as T[]);

export const invoke = <T>(fn: () => T): T => fn();

export function toDictIndexedBy<O, KGetter extends (o: O) => string>(
  list: O[],
  getKey: KGetter,
): { [k: string]: O };
export function toDictIndexedBy<O, KGetter extends (o: O) => string, V>(
  list: O[],
  getKey: KGetter,
  getVal: (o: O) => V,
): { [k: string]: V };
export function toDictIndexedBy<O, KGetter extends (o: O) => string, V>(
  list: O[],
  getKey: KGetter,
  getVal?: (o: O) => V,
) {
  if (getVal) {
    return list.reduce(
      (prev, next) => ({
        ...prev,
        [getKey(next)]: getVal(next),
      }),
      {} as { [k: string]: V },
    );
  }

  return list.reduce(
    (prev, next) => ({
      ...prev,
      [getKey(next)]: next,
    }),
    {} as { [k: string]: O },
  );
}

export const objectKeys = <O extends object>(o: O) =>
  Object.keys(o) as (keyof O)[];

// Use this to get inherited keys as well
export const keyInObject = <X extends {}, Y extends PropertyKey>(
  obj: X,
  prop: Y,
): obj is X & Record<Y, unknown> => prop in obj;

type TupleToUnionType<T extends any[]> = T[number];

export const isOneOf = <T extends string | number, List extends T[]>(
  k: T | undefined,
  listOfOptions: List,
): k is TupleToUnionType<List> => !!k && listOfOptions.indexOf(k) > -1;

export const isObject = (m: unknown): m is object =>
  m !== null && typeof m === 'object';

export const max = (a: number, b: number) => (a > b ? a : b);
export const min = (a: number, ...rest: number[]) => {
  let res = a;

  for (const val of rest) {
    if (val < res) {
      res = val;
    }
  }

  return res;
};
// export const minAll = (a: number, b: number) => (a < b ? a : b);

export const pluralize = (
  condition: boolean,
  wordSingular: string,
  pluralForm: { by: 'append' | 'replace'; str: string } = {
    by: 'append',
    str: 's',
  },
) =>
  condition
    ? pluralForm.by === 'append'
      ? wordSingular + pluralForm.str
      : pluralForm.str
    : wordSingular;

export const objectOmit = <O extends Object, ToOmit extends (keyof O)[]>(
  o: O,
  toOmit: ToOmit,
) =>
  objectKeys(o).reduce(
    (prev, nextKey) => {
      if (toOmit.indexOf(nextKey) > -1) {
        return prev;
      }

      return {
        ...prev,
        [nextKey]: o[nextKey],
      };
    },
    {} as DistributiveOmit<O, TupleToUnionType<ToOmit>>,
  );

export const objectPick = <O extends Object, ToPick extends (keyof O)[]>(
  o: O,
  toPick: ToPick,
) =>
  objectKeys(o).reduce(
    (prev, nextKey) => {
      if (toPick.indexOf(nextKey) === -1) {
        return prev;
      }

      return {
        ...prev,
        [nextKey]: o[nextKey],
      };
    },
    {} as Pick<O, TupleToUnionType<ToPick>>,
  );

export const objectFilterProps = <O extends Object>(
  o: O,
  fn: <K extends keyof O>(k: K, v: O[K]) => boolean,
) =>
  objectKeys(o).reduce(
    (prev, nextKey) =>
      fn(nextKey, o[nextKey])
        ? {
            ...prev,
            [nextKey]: o[nextKey],
          }
        : prev,
    {} as Partial<O>,
  );

export const toImgPath = (asset: any) => asset.src || asset;
