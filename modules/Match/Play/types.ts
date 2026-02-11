import { ChessColor } from '@/lib/ChessRouler';
import { Game, GameOffer } from '@/modules/Game';
import { UserId } from '@/modules/User';

export type PlayerId = string;

export type PlayerInfo = {
  id: string;
  color: ChessColor;
  displayName?: string;
};

export type PlayerInfoWithResults = PlayerInfo & { points?: number };

export type PlayersBySide = {
  home: PlayerInfo;
  away: PlayerInfo;
};

export type PlayersByColor = {
  w: PlayerInfo;
  b: PlayerInfo;
};

export type PlayersBySideWithResults = {
  home: PlayerInfoWithResults;
  away: PlayerInfoWithResults;
};

export type PlayViewState =
  | ({
      hasGame: true;
      game: Game; // TODO: should this be split in display and commited
      turn: ChessColor;
      playersByColor: PlayersByColor;
      playersBySide: PlayersBySide;
      lastOffer?: GameOffer;
    } & (
      | {
          canUserPlay: true;
          userAsPlayerId: UserId;
        }
      | {
          canUserPlay: false;
          userAsPlayerId?: undefined;
        }
    ))
  | {
      hasGame: false;
      game?: undefined;
      turn?: undefined;
      playersByColor?: undefined;
      playersBySide?: undefined;
      canUserPlay?: false;
      lastOffer?: undefined;
    };
