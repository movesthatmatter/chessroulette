export const identity = <T>(n: T) => n;

export const range = (length: number, startAt = 0) =>
  Array.from({ length }, (_, i) => i + startAt);

export type Matrix<T> = T[][];

export type MatrixIndex = [row: number, col: number];

export const matrixMap = <T, R>(
  matrix: Matrix<T>,
  fn: (t: T, index: MatrixIndex) => R
) =>
  matrix.map((row, rowIndex) =>
    row.map((val, colIndex) => fn(val, [rowIndex, colIndex]))
  );

export const matrixForEach = <T>(
  matrix: Matrix<T>,
  fn: (t: T, index: MatrixIndex) => void
) => {
  matrixMap(matrix, fn);
};

export const matrixFind = <T>(
  matrix: Matrix<T>,
  fn: (t: T, index: MatrixIndex) => boolean
): T | undefined => {
  for (let i = 0; i <= matrix.length - 1; i++) {
    const result = matrix[i].find((val, colIndex) => fn(val, [i, colIndex]));
    if (result) {
      return result;
      break;
    }
  }
  return undefined;
};

export const matrixReduce = <T, Accum>(
  matrix: Matrix<T>,
  fn: (accum: Accum, next: T, index: MatrixIndex) => Accum,
  accum: Accum
) => {
  // TODO: Might need to copy this!
  let res = accum;

  matrixForEach(matrix, (next, index) => {
    res = fn(res, next, index);
  });

  return res;
};

// Flips the rows
export const flipMatrixHorizontally = <T>(matrix: Matrix<T>) =>
  matrix.reduce((accum, nextRow) => [nextRow, ...accum], [] as Matrix<T>);

export const flipMatrixVertically = <T>(matrix: Matrix<T>) =>
  matrix.map((row) =>
    row.reduce((accum, nextColVal) => [nextColVal, ...accum], [] as T[])
  );

export const flipMatrixIndexHorizontally = <T>(
  matrix: Matrix<T>,
  [row, col]: MatrixIndex
): MatrixIndex => {
  return [matrix.length - 1 - row, col];
};

export const flipMatrixIndexVertically = <T>(
  matrix: Matrix<T>,
  [row, col]: MatrixIndex
): MatrixIndex => {
  if (matrix.length === 0) {
    return [0, 0];
  }

  return [row, matrix[0].length - 1 - col];
};

export const flipMatrixIndexOnBothAxis = <T>(
  matrix: Matrix<T>,
  [row, col]: MatrixIndex
): MatrixIndex => {
  if (matrix.length === 0) {
    return [0, 0];
  }

  return [matrix.length - 1 - row, matrix[0].length - 1 - col];
};

export const getMatrixRowsLength = (matrix: Matrix<unknown>) => matrix.length;
export const getMatrixColsLength = (matrix: Matrix<unknown>) =>
  matrix[0]?.length || 0;

export const matrixCreate = <T = void>(
  rows: number,
  cols: number = rows,
  val?: T
): Matrix<T> => range(rows).map(() => range(cols).map(() => val as T));

export const matrixGetDimensions = <T>(m: Matrix<T>) => [
  m.length,
  (m[0] || []).length,
];

export const duplicateMatrix = <T>(matrix: Matrix<T>) =>
  matrixMap(matrix, identity);

// This creates a new matrix each time. Immutability!
export const matrixInsert = <T>(
  matrix: Matrix<T>,
  index: MatrixIndex,
  nextVal: T
): Matrix<T> => matrixInsertMany(matrix, [{ index, nextVal }]);

export const matrixInsertMany = <T>(
  matrix: Matrix<T>,
  vals: {
    index: MatrixIndex;
    nextVal: T;
  }[]
) => {
  const nextMatrixInPlace = duplicateMatrix(matrix);

  vals.forEach(({ index, nextVal }) => {
    const [i, j] = index;

    if (i < matrix.length && i > -1) {
      if (j < (matrix[0]?.length || 0) && j > -1) {
        nextMatrixInPlace[i][j] = nextVal;
      }
    }
  });

  return nextMatrixInPlace;
};

export const matrixGet = <T>(matrix: Matrix<T>, [row, col]: MatrixIndex) => {
  const matrixRow = matrix[row];

  if (!matrixRow) {
    return undefined;
  }

  return matrixRow[col];
};

export const printMatrix = <T>(matrix: Matrix<T>) => {
  let res = '';

  matrix.forEach((row) => {
    const r = row
      .map((s) => String(s))
      .map(
        (s) =>
          range(4 - s.length)
            .map(() => ' ')
            .join('') + s
      );

    res += `${r.join(' | ')}\n`;
  });

  console.dir(res);
};
