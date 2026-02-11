import type { PieceSymbol, Square } from 'chess.js';
import { MatrixIndex, matrixMap } from '../../matrix';
import { fenBoardPieceSymbolToDetailedChessPiece } from './piece';
import { AbsoluteCoord, ChessBoard, FENBoard, RelativeCoord } from '../types';

export const ranks = { 1: 7, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2, 7: 1, 8: 0 };
export const files = { a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6, h: 7 };

/**
 * Returns indices for a cell
 * (can be used to access board arrays)
 *
 * Example:
 *   getFileRank("a2") => [0, 6]
 *
 *   2 = 6 because arrays usally are displayed with 0,0 in the upper
 *   left corner
 *
 * @param {string} square - Eg: "a2"
 */
export function getFileRank(square: Square) {
  const [file, rank] = square;

  return [
    files[file as keyof typeof files],
    ranks[Number(rank) as keyof typeof ranks],
  ];
}

export function emptyBoard() {
  const board = [];
  for (let i = 0; i < 8; i++) {
    board[i] = [];
  }
  return board;
}

export const indexedRanks = ['8', '7', '6', '5', '4', '3', '2', '1'] as const;
export const indexedFiles = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

const fileToIndex = {
  a: 0,
  b: 1,
  c: 2,
  d: 3,
  e: 4,
  f: 5,
  g: 6,
  h: 7,
};

export const squareToBoardCoards = (sq: Square): RelativeCoord => ({
  row: indexedRanks.length - Number(sq[1]),
  col: fileToIndex[sq[0] as keyof typeof fileToIndex],
});

/**
 * This is needed when the orientation is black
 *
 * @param c
 * @returns
 */
export const flipBoardCoords = (c: RelativeCoord) => ({
  ...c,
  col: 7 - c.col, // The col are index based
});

export const boardCoordsToSquare = ({
  row,
  col,
}: RelativeCoord): Square | null => {
  const rank = indexedRanks[row];
  const file = indexedFiles[col];

  if (!(rank && file)) {
    return null;
  }

  return `${file}${rank}`;
};

export const getBoardCoordsFromAbsoluteCoords = ({
  absoluteCoords,
  squareSize,
}: {
  absoluteCoords: AbsoluteCoord;
  squareSize: number;
}): RelativeCoord => ({
  row: Math.floor(absoluteCoords.y / squareSize),
  col: Math.floor(absoluteCoords.x / squareSize),
});

export const getSquareSize = (sizePx: number) => sizePx / 8;

export const absoluteCoordsToSquare = (p: {
  absoluteCoords: AbsoluteCoord;
  squareSize: number;
}) => boardCoordsToSquare(getBoardCoordsFromAbsoluteCoords(p));

export const squareToMatrixIndex = (sq: Square): MatrixIndex => {
  const file = fileToIndex[sq[0] as keyof typeof fileToIndex];
  const rank = 8 - Number(sq[1]);

  return [rank, file];
};

// export const matrixIndexToSquare = ([row, col]: MatrixIndex): Square => {
//   const file = indexedFiles[sq[0] as keyof typeof indexedFiles];
//   const rank = 8 - Number(sq[1]);

//   return [rank, file];
// };

export const matrixIndexToSquare = ([row, col]: MatrixIndex): Square => {
  const rank = 8 - row;
  const file = indexedFiles[col];

  return `${file}${rank}` as Square;
};

export const fenBoardToChessBoard = (fenBoard: FENBoard): ChessBoard =>
  matrixMap(fenBoard, (m, index) => {
    if (!m) {
      return null;
    }

    const p = fenBoardPieceSymbolToDetailedChessPiece(m);

    return {
      square: matrixIndexToSquare(index),
      color: p.color,
      type: p.type,
    };
  });

export const chessBoardToFenBoard = (chessBoard: ChessBoard): FENBoard =>
  matrixMap(chessBoard, (p) => {
    if (!p) {
      return '';
    }

    return (p.color === 'b' ? p.type : p.type.toUpperCase()) as PieceSymbol;
  });
