import { MatchPlayersByRole } from './types';

export const getMatchPlayerRoleById = (
  players: MatchPlayersByRole,
  id: string
): keyof MatchPlayersByRole | null => {
  if (players.challenger.id === id) {
    return 'challenger';
  }

  if (players.challengee.id === id) {
    return 'challengee';
  }

  return null;
};
