import { useReducer, useRef, useEffect, useState } from 'react';
import { MovexBoundResourceFromConfig } from 'movex-react';
import { ChessFENBoard, noop, swapColor } from '@xmatter/util-kit';
import { PanelResizeHandle } from 'react-resizable-panels';
import movexConfig from '@app/movex.config';
import { TabsRef } from '@app/components/Tabs';
import { ResizableDesktopLayout } from '@app/templates/ResizableDesktopLayout';
import { useLearnAiActivitySettings } from './hooks/useLearnAiActivitySettings';
import { getSubscribeInfo } from './util';
import { AiCouchDialogContainer } from './DialogContainer/AiCouchDialogContainer';
import { enqueueMovexUpdate } from './util';
import {
  LearnAiActivityState,
  findLoadedChapter,
  initialDefaultChapter,
  //chessAiMode,
  MovePiece,
  aiLearn,
} from './movex';
import { findOpeningFamily, getNextBranchMoves } from './openingDatabase';
import { WidgetPanel } from './components/WidgetPanel';
import { LearnAiBoard } from './components/LearnAiBoard';
import { RIGHT_SIDE_SIZE_PX } from '../../constants';
import inputReducer, { initialInputState } from './reducers/inputReducer';
import socketUtil from '../../../../socketUtil';
import { getProductLabel } from '@app/modules/User';

import { FlipBoardIconButton } from '@app/components/Chessboard';
import { IconButton } from '@app/components/Button';
import { ArrowsMap } from '@app/components/Chessboard/types';
import { FreeBoardHistory } from '@xmatter/util-kit';
import { useIsTablet } from '@app/hooks/useIsTablet';
import { EvalBar } from '@app/modules/ChessEngine/components/EvalBar';

// import { InstructorBoard } from './components/InstructorBoard';

const WRONG_TEST_MOVE_MESSAGES = [
  'Good try, but off-track. Stick strictly to the steps on the board.',
  "Fair effort, but not our focus today. Follow the board's method.",
  'Not bad, but that strays. Realign with the process on the board.',
  'Decent attempt, but wrong path. Focus on the board step-by-step.',
  "Nice try, but let's reset. Follow the exact board breakdown.",
];

type Props = {
  remoteState: LearnAiActivityState['activityState'];
  dispatch?: MovexBoundResourceFromConfig<
    (typeof movexConfig)['resources'],
    'room'
  >['dispatch'];
};

export const LearnAiActivity = ({
  remoteState,
  dispatch: optionalDispatch,
}: Props) => {
  const moveSoundRef = useRef<HTMLAudioElement | null>(null);
  if (!moveSoundRef.current) {
    moveSoundRef.current = new Audio('/chessmove.mp3');
  }
  const wrongMoveSoundRef = useRef<HTMLAudioElement | null>(null);
  if (!wrongMoveSoundRef.current) {
    wrongMoveSoundRef.current = new Audio('/buzz.flac');
    wrongMoveSoundRef.current.volume = 0.4;
  }
  const dispatch = optionalDispatch || noop;

  const [wrongSquare, setWrongSquare] = useState<string | null>(null);
  const wrongMoveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const [hintArrowMap, setHintArrowMap] = useState<ArrowsMap | null>(null);
  const hintArrowTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const newOpeningCallbackRef = useRef<(() => void) | null>(null);
  const keepPlayingCallbackRef = useRef<(() => void) | null>(null);

  const [playerNames, setPlayerNames] = useState(Array<string>);
  const [canFreePlay, setCanFreePlay] = useState(false);
  const [mobileScoreCP, setMobileScoreCP] = useState(0);
  const { isMobile } = useIsTablet();

  const [userData, setUserData] = useState({
    name_first: '',
    name_last: '',
    picture: '',
    is_trial: false,
    user_id: '',
    new_product_id: '',
    subscriptionProduct: '',
    isLoaded: false,
  });
  console.log('userData', userData);
  const settings = useLearnAiActivitySettings();
  const [inputState, dispatchInputState] = useReducer(
    inputReducer,
    initialInputState
  );

  const currentChapter =
    findLoadedChapter(remoteState) || initialDefaultChapter;

  const isAtLastMove = (() => {
    const history = currentChapter.notation?.history ?? [];
    const focusedIndex = currentChapter.notation?.focusedIndex;
    if (!focusedIndex || history.length === 0) return true;
    const lastIndex = FreeBoardHistory.getLastIndexInHistory(history);
    return focusedIndex[0] === lastIndex[0] && focusedIndex[1] === lastIndex[1];
  })();

  const tabsRef = useRef<TabsRef>(null);
  useEffect(() => {
    getUserData();
    //   socketUtil.connect('learn');
    //   localStorage.setItem('socket', 'learn');

    //   return () => {
    //     socketUtil.disconnect();
    //   };
  }, []);

  const getUserData = async () => {
    const data = await getSubscribeInfo().catch(() => null); // i greska zavrsava ucitavanje
    setUserData({
      name_first: data?.name_first,
      name_last: data?.name_last,
      picture: data?.profile_image_url,
      is_trial: data?.is_trial,
      user_id: data?.user_id,
      new_product_id: data?.new_product_id,
      subscriptionProduct: getProductLabel(data ?? {}),
      isLoaded: true,
    });
  };
  const onCanPlayChange = (canPlay: boolean) => {
    setCanFreePlay(canPlay);
  };

  return (
    <ResizableDesktopLayout
      rightSideSize={RIGHT_SIDE_SIZE_PX}
      mainComponent={({ boardSize }) => (
        <>
          {settings.isInstructor && inputState.isActive ? (
            ''
          ) : (
            // <InstructorBoard
            //   fen={inputState.chapterState.displayFen}
            //   boardOrientation={swapColor(inputState.chapterState.orientation)}
            //   boardSizePx={boardSize}
            //   onArrowsChange={(arrowsMap) => {
            //     dispatchInputState({
            //       type: 'updatePartialChapter',
            //       payload: { arrowsMap },
            //     });
            //   }}
            //   onCircleDraw={(payload) => {
            //     dispatchInputState({
            //       type: 'drawCircle',
            //       payload,
            //     });
            //   }}
            //   onClearCircles={() => {
            //     dispatchInputState({ type: 'clearCircles' });
            //   }}
            //   onFlipBoard={() => {
            //     dispatchInputState({
            //       type: 'updatePartialChapter',
            //       payload: {
            //         orientation: swapColor(inputState.chapterState.orientation),
            //       },
            //     });
            //   }}
            //   onUpdateFen={(fen) => {
            //     dispatchInputState({
            //       type: 'updateChapterFen',
            //       payload: { fen },
            //     });
            //   }}
            //   onToggleBoardEditor={() => {
            //     dispatchInputState({
            //       type: 'update',
            //       payload: { isBoardEditorShown: false },
            //     });
            //   }}
            //   onMove={noop}
            // />
            //  Learn Mode */}
            <div>
              <AiCouchDialogContainer
                onPlay={() => keepPlayingCallbackRef.current?.()}
                onMessage={async (payload) =>
                  await enqueueMovexUpdate(() =>
                    dispatch({
                      type: 'loadedChapter:writeMessage',
                      payload: payload,
                    })
                  )
                }
                canFreePlay={canFreePlay}
                currentChapter={currentChapter}
                showCongratulations={currentChapter.aiLearn.popup}
                onDismissCongratulations={async () =>
                  await enqueueMovexUpdate(() =>
                    dispatch({
                      type: 'loadedChapter:setLearnAi',
                      payload: {
                        ...currentChapter.aiLearn,
                        popup: false,
                      } as aiLearn,
                    })
                  )
                }
                onTestAgain={async () => {
                  await enqueueMovexUpdate(() =>
                    dispatch({
                      type: 'loadedChapter:setLearnAi',
                      payload: {
                        ...currentChapter.aiLearn,
                        popup: false,
                        errors: 0,
                      } as aiLearn,
                    })
                  );
                  await enqueueMovexUpdate(() =>
                    dispatch({
                      type: 'loadedChapter:import',
                      payload: {
                        input: { type: 'FEN', val: ChessFENBoard.STARTING_FEN },
                      },
                    })
                  );
                }}
                onNewOpening={() => newOpeningCallbackRef.current?.()}
              />
              <div>
                {isMobile &&
                  (() => {
                    const k = 0.00358208;
                    const rawPct =
                      (1 / (1 + Math.exp(-k * mobileScoreCP))) * 100;
                    const pctW =
                      currentChapter.orientation === 'w'
                        ? rawPct
                        : 100 - rawPct;
                    const pctB = 100 - pctW;
                    return (
                      <EvalBar
                        percentW={pctW}
                        percentB={pctB}
                        scoreCP={0}
                        hideScore
                        wrapperClassName="w-[96%] h-[8px] flex overflow-hidden  mb-2 rounded-xl"
                      />
                    );
                  })()}
                <LearnAiBoard
                  sizePx={boardSize}
                  {...currentChapter}
                  canPlay={
                    isAtLastMove && !!currentChapter.aiLearn.name?.trim()
                  }
                  arrowsMap={
                    !isAtLastMove
                      ? {}
                      : hintArrowMap
                      ? { ...currentChapter.arrowsMap, ...hintArrowMap }
                      : currentChapter.arrowsMap
                  }
                  squareRenderer={({ square, children }) => {
                    if (wrongSquare !== square)
                      return null as unknown as React.JSX.Element;
                    return (
                      <div
                        style={{
                          position: 'relative',
                          width: '100%',
                          height: '100%',
                        }}
                      >
                        {children}
                        <svg
                          viewBox="0 0 100 100"
                          style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none',
                          }}
                        >
                          <line
                            x1="18"
                            y1="18"
                            x2="82"
                            y2="82"
                            stroke="#f2358d"
                            strokeWidth="14"
                            strokeLinecap="round"
                          />
                          <line
                            x1="82"
                            y1="18"
                            x2="18"
                            y2="82"
                            stroke="#f2358d"
                            strokeWidth="14"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    );
                  }}
                  orientation={
                    // The instructor gets the opposite side as the student (so they can play together)
                    settings.isInstructor
                      ? swapColor(currentChapter.orientation)
                      : currentChapter.orientation
                  }
                  onFlip={() => {
                    enqueueMovexUpdate(() =>
                      dispatch({
                        type: 'loadedChapter:setOrientation',
                        payload: {
                          color: swapColor(currentChapter.orientation),
                        },
                      })
                    );
                  }}
                  onMove={async (payload) => {
                    const mode = currentChapter.aiLearn?.mode;

                    // Branch opening mode: validate against all family variants
                    if (mode === 'opening') {
                      const family = findOpeningFamily(
                        currentChapter.aiLearn?.name ?? ''
                      );
                      if (family) {
                        const history = currentChapter.notation?.history ?? [];
                        const playedMoves: string[] = [];
                        (history as any[]).flat().forEach((m: any) => {
                          if (m && !m.isNonMove)
                            playedMoves.push(
                              `${m.from}${m.to}${m.promotion ?? ''}`
                            );
                        });
                        const branches = getNextBranchMoves(
                          family,
                          playedMoves
                        );
                        if (branches.length > 0) {
                          const isAllowed = branches.some((bm) =>
                            bm.uci.startsWith(`${payload.from}${payload.to}`)
                          );
                          if (!isAllowed) {
                            if (wrongMoveTimeoutRef.current)
                              clearTimeout(wrongMoveTimeoutRef.current);
                            setWrongSquare(payload.to);
                            wrongMoveTimeoutRef.current = setTimeout(
                              () => setWrongSquare(null),
                              700
                            );
                            if (wrongMoveSoundRef.current) {
                              wrongMoveSoundRef.current.currentTime = 0;
                              wrongMoveSoundRef.current.play().catch(() => {});
                            }
                            return;
                          }
                        }
                        // branches.length === 0 → all variants exhausted, free play
                        moveSoundRef.current?.play();
                        await enqueueMovexUpdate(() =>
                          dispatch({ type: 'loadedChapter:addMove', payload })
                        );
                        return true;
                      }
                    }

                    const openingMoves =
                      mode === 'test'
                        ? currentChapter.aiLearn?.moves_test ?? []
                        : currentChapter.aiLearn?.moves ?? [];

                    if (
                      (mode === 'opening' || mode === 'test') &&
                      openingMoves.length > 0
                    ) {
                      const history = currentChapter.notation?.history ?? [];
                      const playedMoves: string[] = [];
                      (history as any[]).flat().forEach((m: any) => {
                        if (m && !m.isNonMove) {
                          playedMoves.push(
                            `${m.from}${m.to}${m.promotion ?? ''}`
                          );
                        }
                      });
                      const moveCount = playedMoves.length;

                      // opening mode only enforces the first 10 moves; test mode enforces all predefined moves
                      const withinValidationRange =
                        mode === 'test' ? true : moveCount < 8;

                      if (withinValidationRange) {
                        const followsOpening =
                          openingMoves.length > moveCount &&
                          playedMoves.every((m, i) => openingMoves[i] === m);

                        if (followsOpening) {
                          const nextUci = openingMoves[moveCount];
                          if (
                            !nextUci ||
                            !nextUci.startsWith(`${payload.from}${payload.to}`)
                          ) {
                            if (wrongMoveTimeoutRef.current)
                              clearTimeout(wrongMoveTimeoutRef.current);
                            setWrongSquare(payload.to);
                            wrongMoveTimeoutRef.current = setTimeout(
                              () => setWrongSquare(null),
                              700
                            );
                            if (wrongMoveSoundRef.current) {
                              wrongMoveSoundRef.current.currentTime = 0;
                              wrongMoveSoundRef.current.play().catch(() => {});
                            }
                            if (mode === 'test') {
                              enqueueMovexUpdate(() =>
                                dispatch({
                                  type: 'loadedChapter:setLearnAi',
                                  payload: {
                                    ...currentChapter.aiLearn,
                                    errors:
                                      (currentChapter.aiLearn.errors ?? 0) + 1,
                                  } as aiLearn,
                                })
                              );
                              const wrongMoveMessage =
                                WRONG_TEST_MOVE_MESSAGES[
                                  Math.floor(
                                    Math.random() *
                                      WRONG_TEST_MOVE_MESSAGES.length
                                  )
                                ];
                              enqueueMovexUpdate(() =>
                                dispatch({
                                  type: 'loadedChapter:writeMessage',
                                  payload: {
                                    content: wrongMoveMessage,
                                    participantId: 'chatGPT123456',
                                    idResponse:
                                      currentChapter.messages[
                                        currentChapter.messages.length - 1
                                      ]?.idResponse ?? '',
                                  },
                                })
                              );
                              if (nextUci && nextUci.length >= 4) {
                                const hFrom = nextUci.slice(0, 2);
                                const hTo = nextUci.slice(2, 4);
                                const color = '#07DA63';
                                const id = `${hFrom}${hTo}-${color}`;
                                if (hintArrowTimeoutRef.current)
                                  clearTimeout(hintArrowTimeoutRef.current);
                                setHintArrowMap({
                                  [id]: [hFrom, hTo, color],
                                } as ArrowsMap);
                                hintArrowTimeoutRef.current = setTimeout(
                                  () => setHintArrowMap(null),
                                  2000
                                );
                              }
                            }
                            return;
                          }
                        }
                      }
                    }

                    moveSoundRef.current?.play();
                    await enqueueMovexUpdate(() =>
                      dispatch({ type: 'loadedChapter:addMove', payload })
                    );

                    if (mode === 'test') {
                      const movesTest =
                        currentChapter.aiLearn?.moves_test ?? [];
                      const history = currentChapter.notation?.history ?? [];
                      const played: string[] = [];
                      (history as any[]).flat().forEach((m: any) => {
                        if (m && !m.isNonMove) played.push(`${m.from}${m.to}`);
                      });
                      if (
                        movesTest.length > 0 &&
                        played.length >= movesTest.length - 2
                        //dialog da se pojavi ranije 3 --> 2
                      ) {
                        await enqueueMovexUpdate(() =>
                          dispatch({
                            type: 'loadedChapter:setLearnAi',
                            payload: {
                              ...currentChapter.aiLearn,
                              popup: true,
                            } as aiLearn,
                          })
                        );
                      }
                    }

                    return true;
                  }}
                  onArrowsChange={(payload) => {
                    // console.log('arrow karioka');
                    // dispatch({ type: 'loadedChapter:setArrows', payload });
                  }}
                  onCircleDraw={async (tuple) => {
                    await enqueueMovexUpdate(() =>
                      dispatch({
                        type: 'loadedChapter:drawCircle',
                        payload: tuple,
                      })
                    );
                  }}
                  onClearCircles={async () => {
                    await enqueueMovexUpdate(() =>
                      dispatch({ type: 'loadedChapter:clearCircles' })
                    );
                  }}
                  onClearBoard={async () => {
                    await enqueueMovexUpdate(() =>
                      dispatch({
                        type: 'loadedChapter:updateFen',
                        payload: ChessFENBoard.ONLY_KINGS_FEN,
                      })
                    );
                  }}
                  onResetBoard={async () => {
                    await enqueueMovexUpdate(() =>
                      dispatch({
                        type: 'loadedChapter:updateFen',
                        payload: ChessFENBoard.STARTING_FEN,
                      })
                    );
                  }}
                  onBoardEditor={() => {
                    dispatchInputState({
                      type: 'activate',
                      payload: {
                        isBoardEditorShown: true,
                        chapterState: currentChapter,
                      },
                    });
                    tabsRef.current?.focusByTabId('chapters', 2);
                  }}
                  rightSideClassName="flex-1"
                  rightSideComponent={
                    <>
                      {/* <div className="flex flex-col gap-2 mb-2">
                        <FlipBoardIconButton
                          tooltipPositon="right"
                          onClick={async () => {
                            await enqueueMovexUpdate(() =>
                              dispatch({
                                type: 'loadedChapter:setOrientation',
                                payload: {
                                  color: swapColor(currentChapter.orientation),
                                },
                              })
                            );
                          }}
                        /> */}
                      {/* <IconButton
                          icon="ArrowUturnLeftIcon"
                          iconKind="outline"
                          type="clear"
                          size="sm"
                          tooltip="Undo"
                          tooltipPositon="right"
                          className="text-slate-400 hover:text-white"
                          disabled={!currentChapter.notation?.history?.length}
                          onClick={async () => {
                            const history =
                              currentChapter.notation?.history ?? [];
                            if (history.length > 0) {
                              const lastIndex =
                                FreeBoardHistory.getLastIndexInHistory(history);
                              await enqueueMovexUpdate(() =>
                                dispatch({
                                  type: 'loadedChapter:deleteHistoryMove',
                                  payload: lastIndex,
                                })
                              );
                            }
                          }}
                        /> 
                      </div>*/}
                      <div className="relative flex flex-1 flex-col items-center justify-center">
                        <PanelResizeHandle
                          className="w-1 h-20 rounded-lg bg-slate-600"
                          title="Resize"
                        />
                      </div>
                      <div className="flex-1" />
                    </>
                  }
                />
              </div>
            </div>
          )}
        </>
      )}
      rightComponent={
        <div className="flex flex-col gap-4 h-[360px] md:h-full  w-full h-full flex-1 md:min-h-0 pb-4 md:pb-0 ">
          {/* <div className="overflow-hidden  rounded-lg shadow-2xl mb-4">
            <img
              src="https://outpostchess.fra1.digitaloceanspaces.com/bfce3526-2133-4ac5-8b16-9c377529f0b6.jpg"
              alt=""
            />
          </div> */}
          {inputState.isActive && (
            <div className="flex gap-2">
              <span className="capitalize">Editing</span>
              <span className="font-bold">
                "{inputState.chapterState.name}"
              </span>
            </div>
          )}
          <WidgetPanel
            addGameEvaluation={async (score) => setMobileScoreCP(score)}
            onTakeBack={async (payload) => {
              await enqueueMovexUpdate(() =>
                dispatch({
                  type: 'loadedChapter:takeBack',
                  payload,
                })
              );
            }}
            onMove={async (payload) => {
              moveSoundRef.current?.play();
              await enqueueMovexUpdate(() =>
                dispatch({ type: 'loadedChapter:addMove', payload })
              );
            }}
            onCircleDraw={async (tuple) => {
              await enqueueMovexUpdate(() =>
                dispatch({
                  type: 'loadedChapter:drawCircle',
                  payload: tuple,
                })
              );
            }}
            onArrowsChange={async (payload) => {
              await enqueueMovexUpdate(() =>
                dispatch({ type: 'loadedChapter:setArrows', payload })
              );
            }}
            onMessage={async (payload) =>
              await enqueueMovexUpdate(() =>
                dispatch({ type: 'loadedChapter:writeMessage', payload })
              )
            }
            onCanPlayChange={(payload) => onCanPlayChange(payload)}
            onFlipBoard={() => {
              enqueueMovexUpdate(() =>
                dispatch({
                  type: 'loadedChapter:setOrientation',
                  payload: { color: swapColor(currentChapter.orientation) },
                })
              );
            }}
            onSetOrientation={(color) => {
              enqueueMovexUpdate(() =>
                dispatch({
                  type: 'loadedChapter:setOrientation',
                  payload: { color: color as 'w' | 'b' },
                })
              );
            }}
            userData={userData}
            playerNames={playerNames}
            currentChapterState={currentChapter}
            chaptersMap={remoteState?.chaptersMap || {}}
            inputModeState={inputState}
            chaptersMapIndex={remoteState?.chaptersIndex || 0}
            currentLoadedChapterId={remoteState?.loadedChapterId}
            ref={tabsRef}
            isInstructor={settings.isInstructor}
            showEngine={settings.showEngine}
            onActivateInputMode={(payload) => {
              dispatchInputState({ type: 'activate', payload });
            }}
            onDeactivateInputMode={() => {
              dispatchInputState({ type: 'deactivate' });
            }}
            onUpdateInputModeState={(payload) => {
              dispatchInputState({ type: 'update', payload });
            }}
            onHistoryNotationRefocus={async (payload) => {
              await enqueueMovexUpdate(() =>
                dispatch({
                  type: 'loadedChapter:focusHistoryIndex',
                  payload,
                })
              );
            }}
            onHistoryNotationDelete={async (payload) => {
              await enqueueMovexUpdate(() =>
                dispatch({
                  type: 'loadedChapter:deleteHistoryMove',
                  payload,
                })
              );
            }}
            addLearnAi={async (payload: aiLearn) =>
              await enqueueMovexUpdate(() =>
                dispatch({
                  type: 'loadedChapter:setLearnAi',
                  payload: payload as aiLearn,
                })
              )
            }
            onImport={async (payload) => {
              // TODO: This is retarded - having to check and then send the exact same thing :)
              if (payload.type === 'FEN') {
                await enqueueMovexUpdate(() =>
                  dispatchInputState({ type: 'import', payload })
                );
              } else {
                await enqueueMovexUpdate(() =>
                  dispatchInputState({ type: 'import', payload })
                );
              }
            }}
            onCreateChapter={() => {
              if (inputState.isActive) {
                enqueueMovexUpdate(() =>
                  dispatch({
                    type: 'createChapter',
                    payload: inputState.chapterState,
                  })
                );
              }
            }}
            onUpdateChapter={(id) => {
              if (inputState.isActive) {
                enqueueMovexUpdate(() =>
                  dispatch({
                    type: 'updateChapter',
                    payload: {
                      id,
                      state: inputState.chapterState,
                    },
                  })
                );
              }
            }}
            onDeleteChapter={(id) => {
              enqueueMovexUpdate(() =>
                dispatch({
                  type: 'deleteChapter',
                  payload: { id },
                })
              );
            }}
            onLoadChapter={(id) => {
              enqueueMovexUpdate(() =>
                dispatch({
                  type: 'loadChapter',
                  payload: { id },
                })
              );
            }}
            onQuickImport={(input) => {
              enqueueMovexUpdate(() =>
                dispatch({
                  type: 'loadedChapter:import',
                  payload: { input },
                })
              );
            }}
            onRegisterNewOpening={(fn) => {
              newOpeningCallbackRef.current = fn;
            }}
            onRegisterKeepPlaying={(fn) => {
              keepPlayingCallbackRef.current = fn;
            }}
          />
        </div>
      }
    />
  );
};
