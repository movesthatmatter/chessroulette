import { isLeft, Either } from 'fp-ts/lib/Either';
import { objectKeys } from 'movex-core-util';
import { Err, Ok, Result } from 'ts-results';
import { AnyAction, MovexReducer } from 'movex-core-util';
import * as deepObject from 'deep-object-diff';
import { isObject } from '@/lib/misc';

// TODO: This might not need to use Eithe
export const eitherToResult = <T, E>(either: Either<E, T>): Result<T, E> => {
  if (isLeft(either)) {
    return new Err(either.left);
  }

  return new Ok(either.right);
};

export const formatURLSearchParams = (
  href: string,
  searchParams?: Record<string, string | number>
): string => {
  const url = new URL(href);

  if (searchParams) {
    objectKeys(searchParams).forEach((key) => {
      url.searchParams.set(key, String(searchParams[key]));
    });
  }

  return url.href;
};

export const wrapReducer = <S, A extends AnyAction>(
  original: MovexReducer<S, A>,
  wrapper: ((next: S, action: A, prev: S) => S) &
    Pick<MovexReducer<S, A>, '$canReconcileState' | '$transformState'>,
  wrapperStaticFns?: Pick<
    MovexReducer<S, A>,
    '$canReconcileState' | '$transformState'
  >
) => {
  const fn: MovexReducer<S, A> = (prev, action) =>
    wrapper(original(prev, action), action, prev);

  // TODO: This currently does not work with compoisition - How should it? By adding the trughts or?
  fn.$canReconcileState =
    wrapperStaticFns?.$canReconcileState ||
    wrapper.$canReconcileState ||
    original.$canReconcileState;

  const $wrapperTransformState =
    wrapperStaticFns?.$transformState || wrapper.$transformState;
  fn.$transformState = $wrapperTransformState
    ? (s, c) =>
        $wrapperTransformState(
          original.$transformState ? original.$transformState(s, c) : s,
          c
        )
    : original.$transformState;

  return fn;
};

// export const mapReducer = <S, A extends AnyAction, R>(
//   reducer: MovexReducer<S, A>,
//   transform: (prev: S) => R
// ): ((s: R, a: A) => R) &
//   Pick<MovexReducer<R, A>, '$canReconcileState'> & {
//     $transformState?: (
//       ...s: Parameters<NonNullable<MovexReducer<R, A>['$transformState']>>
//     ) => R;
//   } => {
//   const fn: ((s: S, a: A) => R) &
//     Pick<MovexReducer<R, A>, '$canReconcileState'> & {
//       $transformState?: (
//         ...s: Parameters<NonNullable<MovexReducer<S, A>['$transformState']>>
//       ) => R;
//     } = (s: S, a: A) => transform(reducer(s, a));

//   const reducerTransformState = reducer.$transformState;
//   fn.$transformState = reducerTransformState
//     ? (s, c) => transform(reducerTransformState(s, c))
//     : undefined;

//   fn.$canReconcileState = reducer.$canReconcileState;

//   return fn;
// };

export const composeReducers = <S, A extends AnyAction>(
  ...reducers: MovexReducer<S, A>[]
): MovexReducer<S, A> => {
  if (reducers.length === 0) {
    // infer the argument type so it is usable in inference down the line
    return (s: S, _: A) => s;
  }

  if (reducers.length === 1) {
    return reducers[0];
  }

  return reducers.reduce((prevReducer, nextReducer) =>
    wrapReducer(prevReducer, nextReducer)
  );
};

export const reducerLogger = <S, A extends AnyAction>(
  reducer: MovexReducer<S, A>,
  name = ''
) =>
  wrapReducer(reducer, (next, a, prev) => {
    // TODO: Move this here in a logger middleware
    console.group(`${name} Action:`, a.type);
    console.log('Payload:', (a as any).payload);
    console.log('Prev:', prev);
    console.log('Next:', next);
    if (isObject(prev) && isObject(next)) {
      console.log('Detailed Diff', deepObject.detailedDiff(prev, next));
      console.log('Simple Diff', deepObject.diff(prev, next));
    } else {
      console.log('Diff is between primitives');
    }
    console.groupEnd();

    return next;
  });

/**
 * Applies the given actions in order
 *
 * @param initialState
 * @param reducer
 * @param actions
 * @returns
 */
export const applyActionsToReducer = <S, A extends AnyAction>(
  reducer: MovexReducer<S, A>,
  initialState: S,
  actions: A[]
): S =>
  actions.reduce((prev, nextAction) => reducer(prev, nextAction), initialState);
