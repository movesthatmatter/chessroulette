import { ChessFENBoard } from '../ChessFENBoard';
import { ChessRouler } from './ChessRouler';

describe('hasSufficientMaterialToForceMate', () => {
  test('starting position', () => {
    const actual = new ChessRouler().hasSufficientMaterialToForceMate('w');

    expect(actual).toBe(true);
  });

  test('king only', () => {
    const actual = new ChessRouler({
      fen: ChessFENBoard.ONLY_KINGS_FEN,
    }).hasSufficientMaterialToForceMate('w');

    expect(actual).toBe(false);
  });

  test('king and knight', () => {
    const actual = new ChessRouler({
      fen: '1n2k3/8/8/8/6PP/4Q3/PP1PPP2/RNB1KBNR w KQ - 0 1',
    }).hasSufficientMaterialToForceMate('b');

    expect(actual).toBe(false);
  });

  test('king and 2 knights', () => {
    const actual = new ChessRouler({
      fen: '1n2k3/8/4n3/8/6PP/4Q3/PP1PPP2/RNB1KBNR w KQ - 0 1',
    }).hasSufficientMaterialToForceMate('b');

    expect(actual).toBe(false);
  });

  test('king, bishop & knight', () => {
    const actual = new ChessRouler({
      fen: '1n2k3/8/8/3b4/6PP/4Q3/PP1PPP2/RNB1KBNR w KQ - 0 1',
    }).hasSufficientMaterialToForceMate('b');

    expect(actual).toBe(true);
  });

  test('king, bishop & bishop of different colors', () => {
    const actual = new ChessRouler({
      fen: '1b2k3/8/8/3b4/6PP/4Q3/PP1PPP2/RNB1KBNR w KQ - 0 1',
    }).hasSufficientMaterialToForceMate('b');

    expect(actual).toBe(true);
  });

  test('king & queen', () => {
    const actual = new ChessRouler({
      fen: '1q2k3/8/8/8/6PP/4Q3/PP1PPP2/RNB1KBNR w KQ - 0 1',
    }).hasSufficientMaterialToForceMate('b');

    expect(actual).toBe(true);
  });

  test('king & rook', () => {
    const actual = new ChessRouler({
      fen: '1r2k3/8/8/8/6PP/4Q3/PP1PPP2/RNB1KBNR w KQ - 0 1',
    }).hasSufficientMaterialToForceMate('b');

    expect(actual).toBe(true);
  });

  test('king & pawn', () => {
    const actual = new ChessRouler({
      fen: '4k3/8/8/2p5/6PP/4Q3/PP1PPP2/RNB1KBNR w KQ - 0 1',
    }).hasSufficientMaterialToForceMate('b');

    expect(actual).toBe(true);
  });
});
