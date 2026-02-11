import { getMovesDetailsFromPGN } from './utils';

describe('test pgn parser', () => {
  test('1. d3 e5 2. f3 -> should return 2 moves, last move by white', () => {
    const result = getMovesDetailsFromPGN('1. d3 e5 2. f3');
    expect(result).toEqual({
      totalMoves: 2,
      lastMoveBy: 'w',
    });
  });
  test('1. d3 -> should return 1 move, last move by white', () => {
    const result = getMovesDetailsFromPGN('1. d3');
    expect(result).toEqual({
      totalMoves: 1,
      lastMoveBy: 'w',
    });
  });
  test('1. d3 e5 2. f3 c4 -> should return 2 moves, last move by black', () => {
    const result = getMovesDetailsFromPGN('1. d3 e5 2. f3 c4');
    expect(result).toEqual({
      totalMoves: 2,
      lastMoveBy: 'b',
    });
  });
  test('empty string -> should return 0 moves, last move undefined', () => {
    const result = getMovesDetailsFromPGN('');
    expect(result).toEqual({
      totalMoves: 0,
      lastMoveBy: undefined,
    });
  });
  //TODO - add more extreme cases
});
