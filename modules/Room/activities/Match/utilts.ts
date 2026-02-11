import { MatchState } from '@/modules/Match/movex';
import { UsersMap } from '@/modules/User';

export const populateMatchWithParticipants = (
  match: NonNullable<MatchState>,
  participants: UsersMap
) => ({
  ...match,
  challenger: {
    ...match.challenger,
    ...participants[match.challenger.id],
  },
  challengee: {
    ...match.challengee,
    ...participants[match.challengee.id],
  },
});
