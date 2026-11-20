import React, { useEffect, useState, useMemo } from 'react';
import { Dialog } from '@app/components/Dialog';
import { Text } from '@app/components/Text';
import { now } from '@app/lib/time';
import { invoke } from '@xmatter/util-kit';
import { BetweenGamesAborter } from './components/BetweenGamesAborter';
import { Button } from '../../../../components/Button/Button';
import { Icon } from '@app/components/Icon/Icon';
import { AiSearchIcon } from '@app/components/Icon/AiSearchIcon';
import { useRouter } from 'next/navigation';
import {
  checkUser,
  sendResult,
  getUserStreakPlay,
  patchUserStreakPlay,
  getLossPaywallKind,
} from '@app/modules/Match/utilsOutpost';
import { Paywall } from '@app/components/Paywall/Paywall';
import {
  PlayDialogContainer,
  PlayDialogContainerContainerProps,
} from '@app/modules/Match/Play/containers';
import {
  useMatchActionsDispatch,
  useMatchViewState,
} from '../../hooks/useMatch';
//import { useBoardTheme } from '../../../../components/Chessboard/hooks/useBoardTheme';

import Link from 'next/link';
import { getMatchPlayerRoleById } from '../../movex/util';
import { gameOverReasonsToDisplay } from './util';
import { useGame } from '@app/modules/Game/hooks';
import { CounterActions } from '@app/modules/Room/activities/Match/counter';
import { ActiveBot } from '@app/modules/Match/movex/types';

import { newRematchRequestInitiate } from '../../utilsOutpost';
import { GoogleAd } from '@app/components/GoogleAd/GoogleAd';
import { EndGameQuickChat } from '../../widgets/QuickChat';

let sessionMatchStreakChecked = false;
let sessionLossStreakChecked = false;
import { useMovexBoundResourceFromRid } from 'movex-react';
import movexConfig from '@app/movex.config';
import { useMovexClient } from 'movex-react';
import { movexSubcribersToUserMap } from '@app/providers/MovexProvider';
import { useParams } from 'next/navigation';

export type ActivityActions = CounterActions;

const RATING_COUNT_DELAY_MS = 250;
const RATING_COUNT_MS = 900;

// Rejting "odbrojava" od starog do novog, pa iskoci bedz sa razlikom
const RatingChange = ({
  newRating,
  diff,
}: {
  newRating: number;
  diff: number | null;
}) => {
  const oldRating = diff === null ? newRating : newRating - diff;
  const [shownRating, setShownRating] = useState(oldRating);
  const [countDone, setCountDone] = useState(false);

  useEffect(() => {
    if (!diff) {
      setShownRating(newRating);
      setCountDone(true);
      return;
    }
    let raf = 0;
    const timeout = setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - start) / RATING_COUNT_MS, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setShownRating(Math.round(oldRating + diff * eased));
        if (progress < 1) {
          raf = requestAnimationFrame(tick);
        } else {
          setCountDone(true);
        }
      };
      raf = requestAnimationFrame(tick);
    }, RATING_COUNT_DELAY_MS);
    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
  }, [newRating, diff]);

  const badgeColor =
    diff === null || diff === 0
      ? 'bg-slate-500/20 text-slate-300'
      : diff > 0
      ? 'bg-[#07da63]/15 text-[#07da63]'
      : 'bg-red-500/15 text-red-400';
  const badgeText =
    diff === null
      ? ''
      : diff === 0
      ? '±0'
      : `${diff > 0 ? '▲' : '▼'} ${Math.abs(diff)}`;

  return (
    <div className="flex items-center gap-3 animate-fadeIn">
      <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">
        Rating
      </span>
      <span className="text-white font-bold text-2xl tabular-nums">
        {shownRating}
      </span>
      {diff !== null && (
        <span
          className={`rounded-full px-2.5 py-0.5 text-sm font-bold tabular-nums ${badgeColor}`}
          style={{
            transition: 'opacity 0.35s ease, transform 0.35s',
            transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            opacity: countDone ? 1 : 0,
            transform: countDone ? 'scale(1)' : 'scale(0.4)',
          }}
        >
          {badgeText}
        </span>
      )}
    </div>
  );
};

type Props = PlayDialogContainerContainerProps & {
  activeBot?: ActiveBot;
  isMobile?: boolean;
};

// export default async function Page({
//   params,
//   searchParams,
// }: {
//   params: { roomId: string };
//   searchParams: Partial<{ theme: string }>;
// }) {
export const MatchStateDialogContainer: React.FC<Props> = ({
  activeBot,
  isMobile,
  ...gameStateDialogProps
}) => {
  const { match, ...matchView } = useMatchViewState();
  const [alreadyRematch, setAlreadyRematch] = useState(false);
  const [endGameReason, setEndGameReason] = useState<string>('');
  const [isHidden, setIsHidden] = useState(false);
  const [streakDays, setStreakDays] = useState<number | null>(null);
  const [animStage, setAnimStage] = useState(0);
  const [badgeNum, setBadgeNum] = useState(0);
  const [badgePulse, setBadgePulse] = useState(false);
  const [matchDialogReady, setMatchDialogReady] = useState(false);
  // Novi rejting posle meca i razlika u odnosu na rejting sa kojim je usao u mec
  const [ratingResult, setRatingResult] = useState<{
    newRating: number;
    diff: number | null;
  } | null>(null);
  // Dok quick poruka putuje kroz movex, rematch ne sme da dispatchuje
  const [quickMessageSending, setQuickMessageSending] = useState(false);
  const [lossStreakPaywallVisible, setLossStreakPaywallVisible] =
    useState(false);
  const [lossStreakPaywallCopy, setLossStreakPaywallCopy] = useState({
    title: '',
    subtitle: '',
    subtitlePro: '',
  });

  // const [matchId, setMatchId] = useState('');
  const [room, setRoom] = useState('');

  //const [userId, setUserId] = useState('');
  const dispatch = useMatchActionsDispatch();
  const router = useRouter();
  const { lastOffer, playerId } = useGame();
  const userId = useMovexClient(movexConfig)?.id;
  const isPlayer =
    !!userId &&
    !!match &&
    (userId === match.challenger.id || userId === match.challengee.id);
  const myRole =
    userId === match?.challenger.id
      ? 'challenger'
      : userId === match?.challengee.id
      ? 'challengee'
      : null;
  const iLostMatch = !!myRole && !!match?.winner && match.winner !== myRole;
  const myDisplayName = myRole
    ? match?.[myRole]?.displayName || match?.[myRole]?.id || ''
    : '';

  const params = useParams<{ roomId: string }>();

  const roomId = params.roomId;

  const roomRid = `room:${roomId}`;
  const movexResource = useMovexBoundResourceFromRid(
    movexConfig,
    roomRid as any
  );

  const participants = useMemo(
    () => movexSubcribersToUserMap(movexResource?.subscribers || {}),
    [movexResource?.subscribers]
  );

  useEffect(() => {
    if (
      (match?.status === 'ongoing' && !activeBot) ||
      match?.status === 'complete' ||
      match?.status === 'aborted'
    ) {
      // Send to grab result from chessroullette
      sendResult(userId).then((ratings) => {
        if (match?.status !== 'complete' || !myRole || !match.winner) return;
        const newRating =
          match.winner === myRole
            ? ratings?.winner_rejting
            : ratings?.loser_rejting;
        if (newRating === null || newRating === undefined) return;
        const roundedNew = Math.round(Number(newRating));
        const oldRating = Number(match[myRole].rating);
        setRatingResult({
          newRating: roundedNew,
          diff: oldRating ? roundedNew - Math.round(oldRating) : null,
        });
      });
      if (match?.status === 'complete') {
        const reasons = [
          'Game ended in checkmate',
          'Match ended in a Draw! 🤝',
          'Game ended in stalemate',
          'Draw by insufficient material',
          'Draw by threefold repetition',
          'Ended by resignation',
          'Match ended in a Draw! 🤝',
          'Game aborted',
          'Game ended on time',
          'Draw by insufficient material',
        ];

        setEndGameReason(reasons[Number(match.endedGames[0].gameOverReason)]);

        if (iLostMatch && !sessionLossStreakChecked) {
          sessionLossStreakChecked = true;
          setTimeout(async () => {
            const lossPaywallKind = await getLossPaywallKind();
            if (lossPaywallKind) {
              const name = myDisplayName;
              if (lossPaywallKind === 'firstLoss') {
                setLossStreakPaywallCopy({
                  title: name
                    ? `Every loss is a lesson ${name}`
                    : `Every loss is a lesson`,
                  subtitle: 'Let Outposty show you what went wrong',
                  subtitlePro: '',
                });
              } else if (lossPaywallKind === 'fiveInRow') {
                setLossStreakPaywallCopy({
                  title: name
                    ? `Five losses in a row ${name}`
                    : `Five losses in a row`,
                  subtitle: 'Your AI coach knows exactly why. Ask it.',
                  subtitlePro: '',
                });
              } else if (lossPaywallKind === 'threeInRow') {
                setLossStreakPaywallCopy({
                  title: name
                    ? `Same mistake ${name}, third time`
                    : `Same mistake, third time`,
                  subtitle: 'Review your games and stop repeating mistakes',
                  subtitlePro:
                    'Learn openings and start your games with confidence',
                });
              }
              setLossStreakPaywallVisible(true);
            }
          }, 1000);
        }

        if (!sessionMatchStreakChecked) {
          sessionMatchStreakChecked = true;
          const checkStreak = async () => {
            try {
              const today = new Date().toISOString().split('T')[0];
              const playResult = await getUserStreakPlay();
              const consecutiveDays = parseInt(
                playResult?.consecutive_days ?? '0',
                10
              );
              const playCelebration = playResult?.play_celebration
                ? new Date(playResult.play_celebration)
                    .toISOString()
                    .split('T')[0]
                : null;
              if (playCelebration !== today) {
                setStreakDays(consecutiveDays);
                patchUserStreakPlay({ play_celebration: today });
              }
            } finally {
              setMatchDialogReady(true);
            }
          };
          checkStreak();
        } else {
          setMatchDialogReady(true);
        }
      }
    }
  }, [match?.status]);

  useEffect(() => {
    if (streakDays === null) {
      setAnimStage(0);
      return;
    }
    setBadgeNum(streakDays);
    const t0 = setTimeout(() => setAnimStage(1), 50);
    const t1 = setTimeout(() => setAnimStage(2), 600);
    const t2 = setTimeout(() => setAnimStage(3), 1100);
    const t3 = setTimeout(() => {
      setBadgeNum(streakDays + 1);
      setBadgePulse(true);
      setTimeout(() => setBadgePulse(false), 400);
    }, 1600);
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [streakDays]);

  useEffect(() => {
    async function runCheck() {
      if (isPlayer == false) {
        return;
      }
      const result = await checkUser(userId);
      // console.log('Tok', result);
      if (result == false) {
        console.log('token error');
        if (
          window.location.hostname !== 'localhost' &&
          userId !== 'czeKS1Q0JDSXJ' &&
          userId !== '8UWCweKl1Gvoi'
        ) {
          router.push('https://app.outpostchess.com/online-list');
        }
      }

      let room = Array(7)
        .fill(0)
        .map(() =>
          'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.charAt(
            Math.random() * 62
          )
        )
        .join('');
      setRoom(room);
    }
    runCheck();
  }, []);

  // Isti uslovi kao za ChatWidget u MatchContainer + lokalni chat toggle
  const hasMatchChat =
    !activeBot ||
    activeBot.botType === 'botelja' ||
    activeBot.botType === 'matchFake';
  const isChatEnabledLocally = invoke(() => {
    try {
      return (
        localStorage.getItem(`chessroulette-chat-enabled-${userId}`) !==
        'false'
      );
    } catch {
      return true;
    }
  });
  const showQuickChat = isPlayer && hasMatchChat && isChatEnabledLocally;

  const handleSendQuickMessage = (content: string) => {
    if (!userId) return;
    const messages = match?.messages || [];
    dispatch({
      type: 'play:sendMessage',
      payload: {
        senderId: userId,
        content,
        timestamp: Date.now(),
        responseId:
          activeBot?.id && messages.length > 1
            ? messages.at(-1)?.responseId
            : undefined,
      },
    });
  };

  const getSenderName = (senderId: string) => {
    const player =
      senderId === match?.challenger.id ? match?.challenger : match?.challengee;
    return player?.displayName || activeBot?.name || 'Opponent';
  };

  const isOpponentInRoom = useMemo(() => {
    // Rana provera - ako nemamo osnovne podatke, oba igrača nisu u sobi

    // Proveri da li imamo validne challenger i challengee podatke
    const challengerId = match?.challenger?.id;
    const challengeeId = match?.challengee?.id;

    if (!challengerId || !challengeeId) {
      return false;
    }

    // Proveri da li su OBA igrača u participants listi
    const challengerConnected = challengerId in participants;
    const challengeeConnected = challengeeId in participants;

    return challengerConnected && challengeeConnected;
  }, [match, participants]);

  if (match?.status === 'aborted') {
    return (
      <Dialog
        dim="strong"
        title="Match Aborted"
        content={
          <>
            <div className="flex items-center w-full flex-col ">
              <Button
                className="w-4/5 md:w-2/3 mb-4 "
                icon="ArrowLeftIcon"
                bgColor="green"
                onClick={() => {
                  window.location.href =
                    'https://app.outpostchess.com/online-list';
                }}
              >
                Lobby&nbsp;&nbsp;&nbsp;
              </Button>
              <GoogleAd isMobile={isMobile} />
            </div>
          </>
        } // should there be something?
      />
    );
  }

  // TODO: Here we should just check the match.status

  if (
    match?.status === 'complete' &&
    // i posle 'accepted' sakriveno - redirect u novu sobu jos traje, a novi klik bi pravio jos jedan rematch
    !(
      lastOffer?.type === 'rematch' &&
      (lastOffer?.status === 'pending' || lastOffer?.status === 'accepted')
    ) &&
    matchDialogReady
  ) {
    if (isHidden) {
      return (
        <>
          <div className="absolute bottom-4 right-4 z-[51]">
            <button
              onClick={() => setIsHidden(false)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-black-light border border-green-600/50 text-white transition-all duration-200 hover:border-green-600 hover:shadow-[0_0_14px_rgba(7,218,99,0.4)] hover:scale-110"
              style={{ boxShadow: '0px 0px 16px 0px #07DA6330' }}
              title="Show options"
            >
              <Icon name="EllipsisHorizontalIcon" className="w-5 h-5" />
            </button>
          </div>
          <Paywall
            visible={lossStreakPaywallVisible}
            onClose={() => setLossStreakPaywallVisible(false)}
            defaultPlan="starter"
          />
        </>
      );
    }

    return (
      <>
        <Dialog
          dim="strong"
          title={`${endGameReason}`}
          hasCloseButton
          compactHeader
          onClose={() => setIsHidden(true)}
          content={
            <div className="flex flex-col gap-4 items-center">
              <div className="flex w-full justify-center content-center text-center flex-col">
                <Text className="text-xl font-semibold">
                  {match.winner === null ? (
                    <span></span>
                  ) : (match.winner == 'challenger' &&
                      match.challenger.id == activeBot?.id) ||
                    (match.winner == 'challengee' &&
                      match.challengee.id == activeBot?.id) ? (
                    <span className="capitalize">
                      {activeBot?.name}
                      {` `}Won{` `}
                      <span>🏆</span>
                    </span>
                  ) : (
                    <span className="capitalize">
                      {match[match.winner].displayName ||
                        match[match.winner].id}
                      {` `}Won{` `}
                      <span>🏆</span>
                    </span>
                  )}
                </Text>
                {activeBot?.botType !== 'basic' && (
                  // Fiksna visina - mesto je rezervisano pa dugmici ne skacu kad rejting stigne
                  <div className="h-10 mt-2 flex items-center justify-center">
                    {ratingResult && (
                      <RatingChange
                        newRating={ratingResult.newRating}
                        diff={ratingResult.diff}
                      />
                    )}
                  </div>
                )}
                {activeBot?.botType !== 'basic' && (
                  <div className="justify-center items-center flex flex-col gap-3 mt-3 w-full">
                    {isPlayer && (
                      <Button
                        icon="ArrowPathRoundedSquareIcon"
                        bgColor="green"
                        className=" transition-all duration-200 w-[85%]  hover hover:shadow-[0_0_12px_rgba(7,218,99,0.25)]"
                        style={{ minWidth: '160px' }}
                        onClick={async () => {
                          if (quickMessageSending) return;
                          if (playerId) {
                            if (!isOpponentInRoom) {
                              try {
                                if (!alreadyRematch) {
                                  await newRematchRequestInitiate(roomId);
                                }
                                setAlreadyRematch(true);
                              } catch (error) {
                                console.error(
                                  '❌ Error sending rematch notification:',
                                  error
                                );
                              }
                            }
                            dispatch((masterContext) => ({
                              type: 'play:sendOffer',
                              payload: {
                                byPlayer: playerId,
                                offerType: 'rematch',
                                timestamp: masterContext.requestAt(),
                              },
                            }));
                          }
                        }}
                      >
                        Rematch
                      </Button>
                    )}

                    <Link
                      className="w-[85%]"
                      href={`https://chess.outpostchess.com/room/new/r${room}?activity=review&userId=${userId}&theme=op&pgn=${roomId}`}
                      //href={`http://localhost:4200/room/new/r${room}?activity=review&userId=${userId}&theme=op&pgn=${roomId}`}
                    >
                      <Button
                        bgColor="green"
                        className="transition-all text-black  duration-200 w-full hover:border-green-600 bg-green-600 animate-reviewPulse"
                        style={{ minWidth: '160px', color: '#000' }}
                        onClick={() => {}}
                      >
                        <AiSearchIcon className="h-5 w-5" />
                        AI Coach Review
                      </Button>
                    </Link>

                    <Button
                      icon="ArrowLeftIcon"
                      bgColor="green"
                      className="transition-all duration-200 w-[85%] hover:text-black  hover:scale-[1.0] hover:shadow-[0_0_12px_rgba(7,218,99,0.25)] mb-2"
                      style={{ minWidth: '160px' }}
                      onClick={() => {
                        window.location.href =
                          'https://app.outpostchess.com/online-list';
                      }}
                    >
                      Lobby
                    </Button>
                    {showQuickChat && userId && (
                      // w-0 + min-w-full: red cipova ne siri dijalog, skroluje samo on
                      <div className="allow-touch-scroll-x w-0 min-w-full">
                        <EndGameQuickChat
                          messages={match.messages || []}
                          currentUserId={userId}
                          getSenderName={getSenderName}
                          onSend={handleSendQuickMessage}
                          onCooldownChange={setQuickMessageSending}
                        />
                      </div>
                    )}
                    {streakDays !== null && (
                      <div className="flex flex-row justify-center items-center gap-4 mt-2 relative right-4 w-full">
                        <div
                          className="relative flex-shrink-0"
                          style={{
                            transition:
                              'opacity 0.5s ease, transform 0.5s ease',
                            opacity: animStage >= 1 ? 1 : 0,
                            transform:
                              animStage >= 1 ? 'scale(1)' : 'scale(0.6)',
                          }}
                        >
                          <img
                            src="/flame.webp"
                            alt="flame"
                            className="w-16 h-18 object-contain"
                          />
                          <span
                            className="absolute bottom-1 right-1 bg-cyan-400 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-[#1c1c1c]"
                            style={{
                              color: '#000000',
                              transition: 'transform 0.3s ease',
                              transform: badgePulse ? 'scale(1.5)' : 'scale(1)',
                            }}
                          >
                            {badgeNum}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span
                            className="text-green-400 text-left font-bold text-xs uppercase tracking-widest"
                            style={{
                              transition:
                                'opacity 0.5s ease, transform 0.5s ease',
                              opacity: animStage >= 2 ? 1 : 0,
                              transform:
                                animStage >= 2
                                  ? 'translateY(0)'
                                  : 'translateY(8px)',
                            }}
                          >
                            Interesting game!
                          </span>
                          <span
                            className="text-white font-bold text-2xl leading-tight"
                            style={{
                              transition:
                                'opacity 0.5s ease, transform 0.5s ease',
                              opacity: animStage >= 3 ? 1 : 0,
                              transform:
                                animStage >= 3
                                  ? 'translateY(0)'
                                  : 'translateY(8px)',
                            }}
                          >
                            {badgeNum}-day streak!
                          </span>
                        </div>
                      </div>
                    )}
                    <GoogleAd isMobile={isMobile} />
                  </div>
                )}
              </div>
            </div>
          }
        />
        <Paywall
          visible={lossStreakPaywallVisible}
          onClose={() => setLossStreakPaywallVisible(false)}
          defaultPlan="starter"
          title={lossStreakPaywallCopy.title}
          subtitle={lossStreakPaywallCopy.subtitle}
          subtitlePro={lossStreakPaywallCopy.subtitlePro}
        />
      </>
    );
  }

  // Show at the end of a game before the next game starts
  if (
    match?.status === 'ongoing' &&
    !match.gameInPlay &&
    matchView.previousGame
  ) {
    const titleSuffix =
      matchView.previousGame.winner === '1/2' ? ' in a Draw!' : '';

    const gameOverReason =
      matchView.previousGame.status === 'complete'
        ? gameOverReasonsToDisplay[matchView.previousGame.gameOverReason]
        : 'Game was aborted';

    const previousGame = matchView.previousGame;

    const renderWinnerMessage = invoke(() => {
      if (previousGame.winner === null) {
        return null;
      }

      if (previousGame.winner === '1/2') {
        return (
          <div className="flex flex-col gap-1">
            {match.type === 'bestOf' && <Text>The round will repeat!</Text>}
          </div>
        );
      }

      const winnerByRole = getMatchPlayerRoleById(
        match,
        previousGame.players[previousGame.winner]
      );

      if (!winnerByRole) {
        return null;
      }

      const playerDisplay =
        match[winnerByRole].displayName || match[winnerByRole].id;

      return (
        <Text className="capitalize font-semibold">{playerDisplay} Won!</Text>
      );
    });

    return (
      <Dialog
        dim="strong"
        title={
          match.type === 'bestOf'
            ? `Game ${matchView.endedGamesCount} Ended${titleSuffix}`
            : `Game Ended${titleSuffix}!`
        }
        content={
          <div className="flex flex-col gap-4 items-center">
            <div>{gameOverReason}</div>
            <div className="flex justify-center content-center text-center">
              {renderWinnerMessage}
            </div>
            {match.breakDurationMs > 0 && (
              <BetweenGamesAborter
                totalTimeAllowedMs={match.breakDurationMs}
                startedAt={now()}
                onFinished={() => {
                  dispatch({ type: 'match:startNewGame' });
                }}
                className="text-slate-500 font-italic"
              />
            )}
          </div>
        }
        // TODO: The rematch functionality needs to be at match level
        // {...(match.type === 'openEnded' && {
        //   buttons: [
        //     {
        //       children: 'Offer Rematch',
        //       onClick: () => {
        //         dispatch({
        //           type: 'play:sendOffer',
        //           payload: {
        //             byPlayer: gameStateDialogProps.playerId,
        //             offerType: 'rematch',
        //           },
        //         });
        //       },
        //       type: 'primary',
        //       bgColor: 'blue',
        //     },
        //   ],
        // })}
      />
    );
  }

  return <PlayDialogContainer {...gameStateDialogProps} />;
};
