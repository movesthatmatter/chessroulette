import { GameOverReason } from '@/lib/ChessRouler';

export const gameOverReasonsToDisplay: { [k in GameOverReason]: string } = {
  [GameOverReason['aborted']]: 'Game was aborted',
  [GameOverReason['acceptedDraw']]: 'Players agreed to draw',
  [GameOverReason['checkmate']]: 'Game ended in checkmate',
  [GameOverReason['draw']]: 'Game ended in a draw',
  [GameOverReason['insufficientMaterial']]:
    'Game ended in a draw due to insufficient material',
  [GameOverReason['threefoldRepetition']]:
    'Game ended in a draw due to a threefold repetition',
  [GameOverReason['resignation']]: 'Player resigned',
  [GameOverReason['stalemate']]:
    'Game ended in a draw due to a stalemate position',
  [GameOverReason['timeout']]: 'Game ended due to timeout',
  [GameOverReason['drawAwardedForInsufficientMaterial']]:
    "Game timed out, but the strong side was awarded a draw due to opponent's insufficient material to force mate",
};
