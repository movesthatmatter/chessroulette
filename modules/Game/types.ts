import {
  ChessColor,
  ChessFEN,
  ChessPGN,
  GameOverReason,
  ShortChessMove,
} from '@/lib/ChessRouler';
import { User } from '@/modules/User';
import { GameTimeClass } from './io';
import { FBHHistory, FBHIndex } from '@/lib/FreeBoardHistory';

export { type GameTimeClass } from './io';

export type GameDisplayState = {
  fen: ChessFEN;
  history: FBHHistory;
  focusedIndex: FBHIndex;
  turn: ChessColor;
  lastMove?: ShortChessMove;
};

export type ChessGameTimeMap = {
  [k in GameTimeClass]: number;
};

export type GamePlayers = {
  w: string;
  b: string;
};

export type GameStateWinner = keyof GamePlayers | '1/2';

export type GameOffer = {
  // TODO: this should not be byPlayer but byColor, since inside the Game there is no notion of player but just of color
  byPlayer: User['id'];

  //TODO - probably need toParticipant as well, but not sure how to get it now
  type: 'takeback' | 'draw' | 'rematch';
  status: 'pending' | 'accepted' | 'denied' | 'cancelled';

  // Nededed? If so change to Date or smtg
  timestamp?: number;
};

/**
 * A Game That is not yet started or idling (maybe the players haven't joined yet)
 */
export type PendingGame = {
  status: 'pending';
  startedAt: null;
  timeClass: GameTimeClass;

  // Since lastActivity
  timeLeft: {
    lastUpdatedAt: null;
    w: number;
    b: number;
  };
  pgn: '';
  lastMoveBy: ChessColor; // This could be undefined as well
  lastMoveAt: null;
  winner: null;
  offers: GameOffer[]; // TODO: Make this undefined
  gameOverReason: null;
  players: GamePlayers;
};

/**
 * A Pending Game moves into Idling based on a certain Event (e.g such as both players joined or at a certain date/time)
 *
 * This State is needed in order to allow a certain period of Idle time to make a move, without the players to incurr a game loss
 */
export type IdlingGame = {
  status: 'idling';
  // This reflects when the Game has Started - as Idle First
  startedAt: number; // Change this to ISODateTime
  timeClass: GameTimeClass;

  // Since lastActivity
  timeLeft: {
    lastUpdatedAt: null; // TODO: Change this to ISODateTime
    w: number;
    b: number;
  };
  pgn: ChessPGN;
  lastMoveBy: ChessColor;
  // This is number in case white made its first move and waiting for black, or undefined otherwise
  lastMoveAt: number | null; // TODO: Change this to ISODateTime
  winner: null;
  offers: GameOffer[]; // TODO: Make this undefined
  gameOverReason: null;
  players: GamePlayers;
};

/**
 * Idling to Ongoing
 *
 * Once both players made their first move (aka after first black move) the Game moves to Ongoing
 */
export type OngoingGame = {
  status: 'ongoing';
  // This reflects when the Game has Started - as Idle First and then Ongoing
  startedAt: number; // Change this to ISODateTime
  timeClass: GameTimeClass;

  // Since lastActivity
  timeLeft: {
    lastUpdatedAt: number; // this is the same as lastMoveAt but can be different as well
    w: number;
    b: number;
  };
  pgn: ChessPGN;
  lastMoveBy: ChessColor;
  lastMoveAt: number; // TODO: Change this to ISODateTime
  winner: null;
  offers: GameOffer[];
  gameOverReason: null;
  players: GamePlayers;
};

/**
 * Ongoing to Complete
 *
 * Once the game finishes or one of players runs out of time (triggered externally)
 */
export type CompletedGame = {
  status: 'complete';
  startedAt: number; // Change this to ISODateTime
  timeClass: GameTimeClass;

  // Since lastActivity
  timeLeft: {
    lastUpdatedAt: number; // this is the same as lastMoveAt but can be different as well
    w: number;
    b: number;
  };
  pgn: ChessPGN;
  lastMoveBy: ChessColor;
  lastMoveAt: number; // TODO: Change this to ISODateTime
  winner: GameStateWinner;
  offers: GameOffer[];
  gameOverReason: GameOverReason;
  players: GamePlayers;
};

/**
 * Idling to Aborted
 *
 * A game can only be aborted if the idling period ran out before the players made a first move
 *
 * How To Check if a Game isAborted?
 * - for white: now() > game.startedAt + iddleTime (10% of timeClass)
 * - for black: now() > game.lastMoveAtAt + iddleTime (10% of timeClass)
 */
export type AbortedGame = {
  status: 'aborted';
  startedAt: number; // Change this to ISODateTime
  timeClass: GameTimeClass;

  // Since lastActivity
  timeLeft: {
    lastUpdatedAt: number | null; // this is the same as lastMoveAt but can be different as well
    w: number;
    b: number;
  };
  pgn: ChessPGN;
  lastMoveBy: ChessColor;
  // This is number in case white made its first move and waiting for black, or undefined otherwise
  lastMoveAt: number | null; // TODO: Change this to ISODateTime
  winner: null;
  offers: GameOffer[];
  gameOverReason: null;
  players: GamePlayers;
};

export type Game =
  | PendingGame
  | IdlingGame
  | OngoingGame
  | CompletedGame
  | AbortedGame;

export type NotEndedGame = Exclude<Game, EndedGame>;
export type EndedGame = AbortedGame | CompletedGame;
