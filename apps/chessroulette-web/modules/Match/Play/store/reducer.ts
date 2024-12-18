import {
  GameOverReason,
  getNewChessGame,
  invoke,
  isOneOf,
  localChessMoveToChessLibraryMove,
  swapColor,
  toLongColor,
} from '@xmatter/util-kit';
import { initialPlayState } from './state';
import { PlayActions } from './types';
import { calculateTimeLeftAt } from './util';
import { Game, GameOffer, GameStateWinner } from '@app/modules/Game';
import { ChessRouler, toShortColor } from 'util-kit/src/lib/ChessRouler';
import { logsy } from '@app/lib/Logsy';

export const reducer = (
  prev: Game = initialPlayState,
  action: PlayActions
): Game => {
  // This moves the game from pending to idling
  if (action.type === 'play:start') {
    // Only a "pending" game can start
    if (prev.status !== 'pending') {
      return prev;
    }

    return {
      ...prev,
      status: 'idling',
      startedAt: action.payload.at,
      lastMoveAt: null,
      players: action.payload.players,
    };
  }

  if (action.type === 'play:move') {
    if (!(prev.status === 'idling' || prev.status === 'ongoing')) {
      // Cannot move otherwise
      return prev;
    }

    const { lastMoveBy, pgn } = prev;
    const { moveAt } = action.payload;

    const chessRouler = new ChessRouler({ pgn });

    try {
      chessRouler.move(localChessMoveToChessLibraryMove(action.payload));
    } catch (error) {
      logsy.error('[Play Reducer] ActionError - "Invalid Move"', {
        action,
        prev,
        error,
      });
      return prev;
    }

    const nextLastMoveBy = toLongColor(swapColor(lastMoveBy));

    const commonPrevGameProps = {
      timeClass: prev.timeClass,
      offers: prev.offers,
      players: prev.players,
    } as const;

    const commonNextGameProps = {
      pgn: chessRouler.pgn(),
      lastMoveBy: nextLastMoveBy,
      lastMoveAt: moveAt,
    } as const;

    if (prev.status === 'idling') {
      // The Game Status advances to "ongoing" only if both players moved
      const canAdvanceToOngoing = chessRouler.moveNumber() >= 2;

      const nextStatus = canAdvanceToOngoing ? 'ongoing' : 'idling';

      if (nextStatus === 'idling') {
        // Next > "Idling"
        return {
          ...prev,
          ...commonNextGameProps,
        };
      }

      // Next > "Ongoing"
      return {
        ...commonPrevGameProps,
        ...commonNextGameProps,
        status: 'ongoing',
        // Copy this over from the "idling" state
        startedAt: prev.startedAt,
        // When moving from Idling to Ongoing (aka. on first black move), the timeLeft doesn't change
        timeLeft: {
          ...prev.timeLeft,
          lastUpdatedAt: moveAt,
        },
        winner: null,
        gameOverReason: null,
      };
    }

    const nextTimeLeft = calculateTimeLeftAt({
      at: moveAt,
      turn: nextLastMoveBy,
      prevTimeLeft: prev.timeLeft,
    });

    // Prev Game Status is "Ongoing"
    const isGameOverResult = chessRouler.isGameOver(
      prev.timeClass !== 'untimed' && nextTimeLeft[nextLastMoveBy] <= 0
        ? toShortColor(nextLastMoveBy)
        : undefined
    );

    if (isGameOverResult.over) {
      const nextWinner: GameStateWinner = invoke(() => {
        // There is no winner if the game is a draw!
        if (isGameOverResult.isDraw) {
          return '1/2';
        }

        return isGameOverResult.reason === GameOverReason['timeout']
          ? prev.lastMoveBy
          : nextLastMoveBy;
      });

      // Next > "Complete"
      return {
        ...commonPrevGameProps,
        ...commonNextGameProps,
        startedAt: prev.startedAt,
        status: 'complete',
        winner: nextWinner,
        timeLeft: nextTimeLeft,
        gameOverReason: isGameOverResult.reason,
      };
    }

    // Next > "Ongoing"
    return {
      ...commonPrevGameProps,
      ...commonNextGameProps,
      status: 'ongoing',
      startedAt: prev.startedAt,
      winner: null,
      timeLeft: nextTimeLeft,
      gameOverReason: null,
    };
  }

  if (action.type === 'play:abortGame') {
    if (prev.status === 'idling') {
      return {
        ...prev,
        status: 'aborted',
      };
    }

    return prev;
  }

  if (action.type === 'play:checkTime') {
    if (prev.status !== 'ongoing') {
      return prev;
    }

    // Clear any pending offer leftover
    const lastOffer =
      prev.offers.length > 0 &&
      (prev.offers[prev.offers.length - 1] as GameOffer).status === 'pending'
        ? ({
            ...prev.offers[prev.offers.length - 1],
            status: 'cancelled',
          } as GameOffer)
        : undefined;

    const turn = toLongColor(swapColor(prev.lastMoveBy));

    const nextTimeLeft = calculateTimeLeftAt({
      at: action.payload.at,
      turn,
      prevTimeLeft: prev.timeLeft,
    });

    if (nextTimeLeft[turn] <= 0) {
      return {
        ...prev,
        status: 'complete',
        winner: prev.lastMoveBy,
        timeLeft: nextTimeLeft,
        gameOverReason: GameOverReason['timeout'],
        ...(lastOffer && {
          gameOffers: [...prev.offers.slice(0, -1), lastOffer],
        }),
      };
    }
  }

  if (action.type === 'play:resignGame') {
    // You can only resign an ongoing game!
    if (prev.status !== 'ongoing') {
      return prev;
    }

    return {
      ...prev,
      status: 'complete',
      winner: toLongColor(swapColor(action.payload.color)),
      gameOverReason: GameOverReason['resignation'],
    };
  }

  if (action.type === 'play:sendOffer') {
    const { byPlayer, offerType } = action.payload;
    const nextOffers: GameOffer[] = [
      ...prev.offers,
      {
        byPlayer,
        type: offerType,
        status: 'pending',
        ...(action.payload.timestamp && {
          timestamp: action.payload.timestamp,
        }),
      },
    ];

    return {
      ...prev,
      offers: nextOffers,
    };
  }

  if (action.type === 'play:acceptOfferDraw') {
    // You can only offer a draw of an ongoing game
    if (prev.status !== 'ongoing') {
      return prev;
    }

    const lastOffer: GameOffer = {
      ...prev.offers[prev.offers.length - 1],
      status: 'accepted',
    };

    const nextOffers = [...prev.offers.slice(0, -1), lastOffer];

    return {
      ...prev,
      status: 'complete',
      winner: '1/2',
      offers: nextOffers,
      gameOverReason: GameOverReason['acceptedDraw'],
    };
  }

  if (action.type === 'play:acceptTakeBack') {
    // You can only accept take back of an ongoing game
    if (prev.status !== 'ongoing') {
      return prev;
    }

    const lastOffer: GameOffer = {
      ...prev.offers[prev.offers.length - 1],
      status: 'accepted',
    };

    const newGame = getNewChessGame({
      pgn: prev.pgn.slice(0, prev.pgn.length - 1),
    });

    const takebackAt =
      prev.offers[prev.offers.length - 1].timestamp || new Date().getTime();

    const elapsedTime = takebackAt - prev.lastMoveAt;
    const nextTimeLeft = prev.timeLeft[prev.lastMoveBy] - elapsedTime;

    const nextTurn = toLongColor(swapColor(prev.lastMoveBy));
    const nextOffers = [...prev.offers.slice(0, -1), lastOffer];

    return {
      ...prev,
      pgn: newGame.pgn(),
      lastMoveBy: nextTurn,
      timeLeft: {
        ...prev.timeLeft,
        [prev.lastMoveBy]: nextTimeLeft,
      },
      offers: nextOffers,
    };
  }

  if (isOneOf(action.type, ['play:denyOffer', 'play:cancelOffer'])) {
    return {
      ...prev,
      // Remove the last offer
      offers: prev.offers.slice(0, -1),
    };
  }

  return prev;
};
