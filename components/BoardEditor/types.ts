import { PieceSan } from '@/lib/ChessRouler';

export type DndItem = {
  pieceSan: PieceSan;
};

export type AbsoluteCoord = {
  x: number;
  y: number;
};

export type RelativeCoord = {
  row: number;
  col: number;
};