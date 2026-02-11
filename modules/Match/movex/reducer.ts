import { MovexReducer } from 'movex-core-util';
import { invoke } from '@/lib/misc';
import * as PlayStore from '@/modules/Match/Play/store';
import { AbortedGame } from '@/modules/Game';
import { MatchActions, MatchState } from './types';
import { initialMatchState } from './state';
import { getMatchPlayerRoleById } from './util';
import { swapColor } from '@/lib/ChessFENBoard';

export const reducer: MovexReducer<MatchState, MatchActions> = (
  prev: MatchState = initialMatchState,
  action: MatchActions
): MatchState => {
  if (!prev) {
    return prev;
  }

  const prevMatch = prev;

  if (action.type === 'match:startNewGame') {
    if (prevMatch.status === 'complete') {
      return prev;
    }

    const prevPlay = prevMatch.gameInPlay;

    if (!prevPlay && prevMatch.endedGames.length === 0) {
      return prev;
    }

    const newGameParams = invoke((): PlayStore.CreatePendingGameParams => {
      const prevGame = prevPlay || prevMatch.endedGames.slice(-1)[0];

      return {
        timeClass: prevGame.timeClass,
        players: {
          w: prevGame.players.b,
          b: prevGame.players.w,
        },
      };
    });

    return {
      ...prev,
      gameInPlay: PlayStore.createPendingGame(newGameParams),
    };
  }

  if (!prevMatch.gameInPlay) {
    return prev;
  }

  const prevOngoingGame = prevMatch.gameInPlay;
  const nextOngoingGame = PlayStore.reducer(prevOngoingGame, action);

  if (nextOngoingGame.status === 'aborted') {
    const abortedCurrentPlay = nextOngoingGame;

    // First game abort results in aborted match. Afterwards results in completed match + winner
    const nextMatchState = invoke(
      (): Pick<NonNullable<MatchState>, 'winner' | 'status'> => {
        return prevMatch.endedGames.length === 0
          ? {
              status: 'aborted',
              winner: null,
            }
          : {
              status: 'complete',
              winner: getMatchPlayerRoleById(
                prevMatch,
                nextOngoingGame.players[nextOngoingGame.lastMoveBy]
              ),
            };
      }
    );

    return {
      ...prev,
      endedGames: [...prevMatch.endedGames, abortedCurrentPlay],
      gameInPlay: null,
      ...nextMatchState,
    };
  }

  if (nextOngoingGame.status !== 'complete') {
    const nextOngoingGameStatus = invoke(
      (): NonNullable<MatchState>['status'] => {
        if (nextOngoingGame.status === 'ongoing') {
          return 'ongoing';
        }
        return prevMatch.endedGames.length > 0 ? 'ongoing' : 'pending';
      }
    );

    return {
      ...prev,
      gameInPlay: nextOngoingGame,
      status: nextOngoingGameStatus,
      ...(nextOngoingGameStatus === 'aborted' && {
        winner: getMatchPlayerRoleById(
          prevMatch,
          nextOngoingGame.players[swapColor(nextOngoingGame.lastMoveBy)]
        ),
      }),
    };
  }

  // Current Game is complete - so Match can only be ongoing or complete.

  const prevPlayersByRole = {
    challengee: prev.challengee,
    challenger: prev.challenger,
  };

  const nextPlayersByRole: Pick<
    NonNullable<MatchState>,
    'challengee' | 'challenger'
  > = invoke(() => {
    if (nextOngoingGame.winner === '1/2') {
      return prevPlayersByRole;
    }

    const winnerByRole = getMatchPlayerRoleById(
      prev,
      nextOngoingGame.players[nextOngoingGame.winner]
    );

    if (!winnerByRole) {
      return prevPlayersByRole;
    }

    return {
      ...prevPlayersByRole,
      [winnerByRole]: {
        ...prevPlayersByRole[winnerByRole],
        points: prevPlayersByRole[winnerByRole].points + 1,
      },
    };
  });

  const winner: NonNullable<MatchState>['winner'] = invoke(() => {
    if (prevMatch.type === 'bestOf') {
      const maxRounds = Math.ceil(prevMatch.rounds / 2);

      if (nextPlayersByRole.challenger.points === maxRounds) {
        return 'challenger';
      }

      if (nextPlayersByRole.challengee.points === maxRounds) {
        return 'challengee';
      }

      return null;
    }

    // TBD how a winner is calculated for the rest of match types
    return null;
  });

  const nextMatchStatus = winner ? 'complete' : 'ongoing';

  return {
    ...prev,
    endedGames: [...prevMatch.endedGames, nextOngoingGame],
    gameInPlay: null,
    status: nextMatchStatus,
    winner,
    ...nextPlayersByRole,
  };
};

reducer.$transformState = (state, masterContext): MatchState => {
  if (!state) {
    return state;
  }

  // Determine if Match is "aborted" onRead
  if (state.status === 'complete' || state.status === 'aborted') {
    return state;
  }

  const ongoingPlay = state.gameInPlay;

  if (ongoingPlay?.status === 'ongoing') {
    const turn = swapColor(ongoingPlay.lastMoveBy);

    const nextTimeLeft = PlayStore.calculateTimeLeftAt({
      at: masterContext.requestAt, // TODO: this can take in account the lag as well
      prevTimeLeft: ongoingPlay.timeLeft,
      turn,
    });

    return {
      ...state,
      gameInPlay: {
        ...ongoingPlay,
        timeLeft: nextTimeLeft,
      },
    };
  }

  // If the ongoing game is idling & the abort time has passed
  if (
    ongoingPlay?.status === 'idling' &&
    masterContext.requestAt > ongoingPlay.startedAt + state.timeToAbortMs
  ) {
    const nextAbortedGame: AbortedGame = {
      ...ongoingPlay,
      status: 'aborted',
    };

    // First game in the match is aborted by idling too long
    // and thus the whole Match gets aborted
    if (state.status === 'pending') {
      return {
        ...state,
        status: 'aborted',
        winner: null,
        endedGames: [nextAbortedGame],
        gameInPlay: null,
      };
    }

    // A subsequent game in the match is aborted by idling too long
    // and thus the Match Gets completed with the winner the opposite player
    if (state.status === 'ongoing') {
      return {
        ...state,
        status: 'complete',
        winner: getMatchPlayerRoleById(
          state,
          ongoingPlay.players[ongoingPlay.lastMoveBy]
        ),
        endedGames: [...state.endedGames, nextAbortedGame],
        gameInPlay: null,
      };
    }
  }

  return state;
};
