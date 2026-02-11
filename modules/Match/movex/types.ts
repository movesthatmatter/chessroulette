import { Action } from 'movex-core-util';
import { PlayActions } from '@/modules/Match/Play/store';
import { EndedGame, NotEndedGame } from '@/modules/Game';

type PlayerId = string;

export type MatchPlayer = {
  id: PlayerId;
  points: number;

  // Maybe this needs to come only on the client? In a MatchPlayerDisplay, but not be part of movex
  displayName?: string;
};

// @deprecate ni favor of players by role
export type MatchPlayers = {
  white: MatchPlayer;
  black: MatchPlayer;
};

export type MatchPlayersByRole = {
  challenger: MatchPlayer;
  challengee: MatchPlayer;
};

export type MatchState =
  | ((
      | {
          type: 'bestOf';
          rounds: number; // Ensure these can only be odd numbers
        }
      | {
          type: 'openEnded';
          rounds?: null; // There is no end so no need for rounds here
        }
    ) & {
      // Add other statuses if needed
      status: 'pending' | 'ongoing' | 'complete' | 'aborted';
      winner: keyof MatchPlayersByRole | null;
      endedGames: EndedGame[];
      gameInPlay: NotEndedGame | null;
      /**
       * This is the time allowed for one player to abort
       */
      timeToAbortMs: number;
      /**
       * This is the time bertween games
       */
      breakDurationMs: number;
    } & MatchPlayersByRole)
  | null; // TODO: This should not be null, but another status

export type MatchActions = PlayActions | Action<'match:startNewGame'>;
