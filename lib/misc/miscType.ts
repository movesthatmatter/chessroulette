import { AnyAction } from 'movex-core-util';
import { MovexDispatchAction } from 'movex';

export type GetComponentProps<T> = T extends
  | React.ComponentType<infer P>
  | React.Component<infer P>
  ? P
  : never;

export type DeepPartial<T> = T extends Function
  ? T
  : T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

type RequiredNotNull<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

export type Ensure<T, K extends keyof T> = T &
  Required<RequiredNotNull<Pick<T, K>>>;

/**
 * Taken from https://stackoverflow.com/a/67794430/2093626
 * This ensures the omit doesn't break distributive uniions!
 */
export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

export type DistributivePick<T, K extends keyof T> = T extends unknown
  ? Pick<T, K>
  : never;

export type UnknownRecord = Record<string, unknown>;
export type StringRecord = Record<string, string>;

export type StringKeys<TRecord extends UnknownRecord> = Extract<
  keyof TRecord,
  string
>;

export type DispatchOf<A extends AnyAction> = MovexDispatchAction<A>;

export type IdentifiableRecord<T extends UnknownRecord> = T & { id: string };

export type TimestampedRecord<T extends UnknownRecord> = T & {
  createdAt: Date;
  updatedAt: Date;
};

export type PersistableRecord<T extends UnknownRecord> = TimestampedRecord<
  IdentifiableRecord<T>
>;
