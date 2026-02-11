import { EndedGame } from '../Game';
import { UserId } from '../User';
// import { Old_Play_Results } from './Play';
import { MatchState } from './movex';

// TODO: this isn't used yet because of the OldPlayResults are
export type MatchResults = {
  challenger: {
    points: number;
  };
  challengee: {
    points: number;
  };
};

export type MatchViewState = {
  match: MatchState;
  currentRound: number;
  previousGame?: EndedGame;
  drawsCount: number;
  endedGamesCount: number;

  /**
   * This is defined when he current User is part of the players, otherwise it's undefined
   */
  userAsPlayer?: {
    id: UserId;
    type: 'challenger' | 'challengee';
  };

  results: MatchResults;

  // TODO: This should be translated to MatchResults
  // @deprecate this in favor of challenger|challengee
  // results: Old_Play_Results;

  // TODO: netx add the new results above
};
