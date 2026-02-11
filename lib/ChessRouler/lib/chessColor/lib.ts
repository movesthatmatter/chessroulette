import {
  BlackColor,
  ChessColor,
  LongChessColor,
  ShortChessColor,
  WhiteColor,
} from './types';
import { getRandomInt } from '../../../misc';

export const isShortChessColor = (s: string): s is ShortChessColor =>
  s === 'b' || s === 'w';

export const isLongChessColor = (s: string): s is LongChessColor =>
  s === 'black' || s === 'white';

export const isChessColor = (
  s: string
): s is ShortChessColor | LongChessColor =>
  isShortChessColor(s) || isLongChessColor(s);

export const toShortChessColor = (
  c: ShortChessColor | LongChessColor
): ShortChessColor => c[0] as ShortChessColor;

export const toLongChessColor = (
  c: ShortChessColor | LongChessColor
): LongChessColor => (c === 'b' ? 'black' : 'white');

export const isWhiteColor = (c: ChessColor): c is WhiteColor =>
  toShortChessColor(c) === 'w';

export const isBlackColor = (c: ChessColor): c is BlackColor =>
  toShortChessColor(c) === 'b';

export const areColorsEqual = (a: ChessColor, b: ChessColor) =>
  toShortChessColor(a) === toShortChessColor(b);

export const getRandomColor = (): ShortChessColor =>
  (['w', 'b'] as const)[getRandomInt(0, 1)];
