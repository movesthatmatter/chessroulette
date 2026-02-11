import { ChessColor } from '@/lib/ChessRouler';

export function getMovesDetailsFromPGN(pgn: string): {
  totalMoves: number;
  lastMoveBy: ChessColor | undefined;
} {
  if (pgn.length === 0) {
    return {
      totalMoves: 0,
      lastMoveBy: undefined,
    };
  }

  // algorithm logic by chatGPT
  const tokens = pgn
    .split(/\s+/)
    .filter(
      (token) =>
        !/^\d+\.$/.test(token) && !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(token)
    );

  return {
    totalMoves: Math.ceil(tokens.length / 2),
    lastMoveBy: tokens.length % 2 === 0 ? 'b' : 'w',
  };
}
