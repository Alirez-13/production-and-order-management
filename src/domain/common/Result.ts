/**
 * Functional Result<T, E> Monad for Typed Domain Error Handling
 * Prevents uncontrolled exceptions and enforces explicit failure modeling.
 */

export type Ok<T> = {
  readonly success: true;
  readonly value: T;
  readonly error?: undefined;
};

export type Err<E> = {
  readonly success: false;
  readonly error: E;
  readonly value?: undefined;
};

export type Result<T, E = string> = Ok<T> | Err<E>;

export const ok = <T>(value: T): Ok<T> => ({
  success: true,
  value,
});

export const err = <E>(error: E): Err<E> => ({
  success: false,
  error,
});

export const isOk = <T, E>(result: Result<T, E>): result is Ok<T> => result.success === true;
export const isErr = <T, E>(result: Result<T, E>): result is Err<E> => result.success === false;

export const unwrap = <T, E>(result: Result<T, E>): T => {
  if (result.success) return result.value;
  throw new Error(`Attempted to unwrap an Err: ${JSON.stringify(result.error)}`);
};

export const unwrapOr = <T, E>(result: Result<T, E>, defaultValue: T): T => {
  if (result.success) return result.value;
  return defaultValue;
};

export const mapResult = <T, U, E>(
  result: Result<T, E>,
  fn: (val: T) => U
): Result<U, E> => {
  if (result.success) {
    return ok(fn(result.value));
  }
  return err(result.error);
};
