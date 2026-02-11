'use client';

import { ResizableDesktopLayout } from '@/templates/ResizableDesktopLayout';
import {
  ChapterCreateInput,
  ChapterModel,
  LessonCreateInput,
  LessonModel,
} from '../types';
import { InstructorBoard } from '../../../Room/activities/Learn/components/InstructorBoard';
import {
  AcvtiveInputState,
  initialInputState,
} from '../../../Room/activities/Learn/reducers/inputReducer';
import { FreeBoardNotation } from '@/components/FreeBoardNotation';
import {
  // ChessColor,
  // ChessFENBoard,
  // FreeBoardHistory,
  // swapColor,
  toDictIndexedBy,
} from '@/lib/misc';
import { WidgetPanel } from '../../../Room/activities/Learn/components/WidgetPanel/WidgetPanel';
import { InstructorWidgetPanel } from '../../../Room/activities/Learn/components/WidgetPanel/InstructorWidgetPanel';
import {
  initialDefaultChapter,
  initialLearnStateActivityState,
} from '../../../Room/activities/Learn/movex/state';
import type {
  Chapter,
  LearnActivityState,
} from '../../../Room/activities/Learn/movex';
import { ChaptersTab } from '../../../Room/activities/Learn/chapters/ChaptersTab';
import { Button } from '@/components/Button';
import { Tabs } from '@/components/Tabs';
import { useEffect, useReducer } from 'react';
// import uncommitedLessonStateReducer from './uncommitedLessonStateReducer_old';
import {
  ChapterState,
  reducer as draftLessonReducer,
  initialLessonState,
} from './draftLessonReducer';
import { LessonState } from './draftLessonReducer';
import { reducerLogger } from '@/lib/util';
import { noop } from 'movex-core-util';
import { swapColor } from '@/lib/ChessFENBoard';

type Props = {
  // lesson: LessonModel;
  state: LessonState;
  onCommit: (draft: LessonState) => void;
};

export const LessonEditorView = ({
  state: commitedLessonState,
  onCommit,
}: Props) => {
  // const lessonState = lessonModelToLessonState(defaultLessonModel);

  // const initialInputState: AcvtiveInputState = {
  //   isActive: true,
  //   isBoardEditorShown: true,
  //   chapterState: lessonState.chaptersMap[lessonState.loadedChapterId],
  // };

  const [draftState, dispatchDraftAction] = useReducer(
    reducerLogger(draftLessonReducer, 'Draft Lesson'),
    commitedLessonState
    // initialLessonState,
    // lessonModelToLessonState(props.lesson)
  );

  const focusedChapter =
    draftState.chaptersMap[draftState.loadedChapterId] || initialDefaultChapter;

  const commitLesson = () => {
    // console.log(
    //   'commit',
    //   draftState,
    //   lessonStateToLessonCreateInput(draftState)
    // );
    onCommit(draftState);
  };

  // useEffect(() => {
  //   console.log('lesson', props.lesson);
  //   console.log('lesson state', lessonModelToLessonState(props.lesson));
  // }, [props.lesson]);

  return (
    <ResizableDesktopLayout
      mainComponent={({ boardSize }) => (
        <InstructorBoard
          boardSizePx={boardSize}
          fen={focusedChapter.displayFen}
          showBoardEditor
          showBoardEditorSaveButtons={false}
          boardOrientation={swapColor(focusedChapter.orientation)}
          onArrowsChange={(arrowsMap) => {
            // dispatchInputState({
            //   type: 'updatePartialChapter',
            //   payload: { arrowsMap },
            // });
          }}
          onCircleDraw={(payload) => {
            // dispatchInputState({
            //   type: 'drawCircle',
            //   payload,
            // });
          }}
          onClearCircles={() => {
            // dispatchInputState({ type: 'clearCircles' });
          }}
          onFlipBoard={() => {
            if (focusedChapter) {
              dispatchDraftAction({
                type: 'loadedChapter:setOrientation',
                payload: {
                  to: swapColor(focusedChapter.orientation),
                },
              });
            }

            // TODO: Fix this
            // dispatchInputState({
            //   type: 'updatePartialChapter',
            //   payload: {
            //     orientation: swapColor(inputState.chapterState.orientation),
            //   },
            // });
          }}
          onUpdateFen={(payload) => {
            dispatchDraftAction({
              type: 'loadedChapter:updateFen',
              payload,
            });
            // dispatchInputState({
            //   type: 'updateChapterFen',
            //   payload: { fen },
            // });
          }}
          onToggleBoardEditor={() => {
            // dispatchInputState({
            //   type: 'update',
            //   payload: { isBoardEditorShown: false },
            // });
          }}
          // TODO: This was added now, bt I'm wondering how till the pieces move if it's nothing??
          onMove={noop}
        />
      )}
      rightSideSize={32}
      rightComponent={
        <div className="flex flex-col flex-1 min-h-0 gap-4">
          <div className="bg-slate-700 p-3 flex flex-col sflex-1 min-h-0 rounded-lg shadow-2xl gap-3">
            {/* <div> */}
            <div className="flex items-center gap-3">
              <label className="font-bold text-sm text-gray-400">
                Lesson Name
              </label>
              <input
                id="title"
                type="text"
                name="Name"
                value={draftState.name}
                className="w-fulls text-sm rounded-md border-slate-400 focus:border-slate-400 border border-transparent block bg-slate-500 text-white block py-1 px-2"
                onChange={(e) => {
                  // partialUpdate({ name: e.target.value });
                }}
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="font-bold text-sm text-gray-400">Tags</label>
              <input
                id="title"
                type="text"
                name="tags"
                value={draftState.tags}
                className="w-fulls text-sm rounded-md border-slate-400 focus:border-slate-400 border border-transparent block bg-slate-500 text-white block py-1 px-2"
                onChange={(e) => {
                  // partialUpdate({ name: e.target.value });
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={commitLesson}
                size="sm"
                buttonType="button"
              >
                Save Lesson
              </Button>
              <Button
                type="secondary"
                className=""
                size="sm"
                buttonType="reset"
              >
                Cancel
              </Button>
            </div>
            {/* </div> */}
          </div>
          {/* {participants && participants[userId] && (
            <div className="overflow-hidden rounded-lg shadow-2xl">
              <CameraPanel
                participants={participants}
                userId={userId}
                peerGroupId={roomId}
                iceServers={iceServers}
                aspectRatio={16 / 9}
              />
            </div>
          )} */}

          {/* {state.isActive ? 'active' : 'not active'} */}
          {/* {inputState.isActive ? (
            <div className="flex gap-2">
              <span className="capitalize">Editing</span>
              <span className="font-bold">
                "{inputState.chapterState.name}"
              </span>
            </div>
          ) : (
            <div>Some Info</div>
            // <ChapterDisplayView chapter={currentChapter} />
          )} */}

          <Tabs
            containerClassName="bg-slate-700 p-3 flex flex-col flex-1 min-h-0 rounded-lg shadow-2xl"
            headerContainerClassName="flex gap-3 pb-3"
            contentClassName="flex-1 flex min-h-0 pt-2"
            // currentIndex={currentTabIndex}
            currentIndex={0}
            // onTabChange={onTabChange}
            renderContainerHeader={({ tabs }) => (
              <div className="flex flex-row gap-3 pb-3 border-b border-slate-600">
                {tabs}
                {/* // Only show the Engine switch on the notation tab */}
                {/* {currentTabIndex === 0 && (
                  <span className="flex-1 flex justify-end">
                    <Switch
                      label="Engine"
                      labelPosition="left"
                      labelClassName="text-slate-400"
                      title="Stockfish 15 Engine"
                      value={showEngine}
                      onUpdate={(s) =>
                        updateableSearchParams.set({ engine: Number(s) })
                      }
                    />
                  </span>
                )} */}
              </div>
            )}
            // ref={tabsRef}
            tabs={[
              {
                id: 'chapters',
                renderHeader: (p) => (
                  <Button
                    onClick={() => {
                      p.focus();
                      // TODO: Add back?
                      // chaptersTabProps.onDeactivateInputMode();
                    }}
                    size="sm"
                    className={`bg-slate-600 font-bold hover:bg-slate-800 ${
                      p.isFocused && 'bg-slate-800'
                    }`}
                  >
                    Chapters ({Object.keys(draftState.chaptersMap).length})
                  </Button>
                ),
                renderContent: (p) => (
                  <ChaptersTab
                    chaptersMap={draftState.chaptersMap}
                    chaptersMapIndex={draftState.chaptersIndex + 1}
                    currentLoadedChapterId={draftState.loadedChapterId}
                    className="min-h-0"
                    tabsNav={p.nav}
                    // inputModeState={inputState}

                    // TODO: This should be called inputModeState because it's tied with the idea there is an input, or maybe it's ok?
                    inputModeState={{
                      // TODO: Anything here to fix??
                      chapterState: focusedChapter,
                    }}
                    // onImportInput={onImport}
                    onImportInput={(payload) => {
                      // TODO: This is retarded - having to check and then send the exact same thing :)
                      // if (payload.type === 'FEN') {
                      //   dispatchInputState({ type: 'import', payload });
                      // } else {
                      //   dispatchInputState({ type: 'import', payload });
                      // }
                    }}
                    onActivateInputMode={(payload) => {
                      // dispatchInputState({ type: 'activate', payload });
                    }}
                    onDeactivateInputMode={() => {
                      // dispatchInputState({ type: 'deactivate' });
                    }}
                    onUpdateInputModeState={(payload) => {
                      // console.log('on update input mode', payload.chapterState)
                      // dispatchInputState({ type: 'update', payload });
                      // if (payload.chapterState) {
                      //   dispatchDraftAction({
                      //     type: 'updateChapter',
                      //     payload: {
                      //       id: focusedChapter.id,
                      //       state: payload.chapterState,
                      //     },
                      //   });
                      // }
                    }}
                    // onHistoryNotationRefocus={(payload) => {
                    //   dispatchInputState({
                    //     type: 'loadedChapter:focusHistoryIndex',
                    //     payload,
                    //   });
                    // }}
                    // onHistoryNotationDelete={(payload) => {
                    //   dispatchInputState({
                    //     type: 'loadedChapter:deleteHistoryMove',
                    //     payload,
                    //   });
                    // }}
                    // onImport={(payload) => {
                    //   // TODO: This is retarded - having to check and then send the exact same thing :)
                    //   if (payload.type === 'FEN') {
                    //     dispatchInputState({ type: 'import', payload });
                    //   } else {
                    //     dispatchInputState({ type: 'import', payload });
                    //   }
                    // }}
                    onCreateChapter={() => {
                      // if (inputState.isActive) {
                      //   dispatchInputState({
                      //     type: 'createChapter',
                      //     payload: inputState.chapterState,
                      //   });
                      // }

                      dispatchDraftAction({
                        type: 'createChapter',
                        payload: focusedChapter,
                      });
                    }}
                    onUpdateChapter={(id) => {
                      // if (inputState.isActive) {
                      //   dispatchInputState({
                      //     type: 'updateChapter',
                      //     payload: {
                      //       id,
                      //       state: inputState.chapterState,
                      //     },
                      //   });
                      // }
                      dispatchDraftAction({
                        type: 'updateChapter',
                        payload: { id, state: focusedChapter },
                      });
                    }}
                    onDeleteChapter={(id) => {
                      dispatchDraftAction({
                        type: 'deleteChapter',
                        payload: { id },
                      });
                    }}
                    onLoadChapter={(id) => {
                      dispatchDraftAction({
                        type: 'loadChapter',
                        payload: { id },
                      });
                    }}
                    // onQuickImport={(payload) => {
                    //   dispatchInputState({
                    //     type: 'loadedChapter:import',
                    //     payload,
                    //   });
                    // }}
                    // {...chaptersTabProps}
                  />
                ),
              },
            ]}
          />

          {/* <InstructorWidgetPanel
            currentChapterState={currentChapter}
            chaptersMap={lessonState.chaptersMap || {}}
            inputModeState={inputState}
            chaptersMapIndex={lessonState.chaptersIndex || 0}
            currentLoadedChapterId={lessonState?.loadedChapterId}
            showEngine={false}
            // ref={tabsRef}
            onActivateInputMode={(payload) => {
              dispatchInputState({ type: 'activate', payload });
            }}
            onDeactivateInputMode={() => {
              dispatchInputState({ type: 'deactivate' });
            }}
            onUpdateInputModeState={(payload) => {
              dispatchInputState({ type: 'update', payload });
            }}
            onHistoryNotationRefocus={(payload) => {
              dispatchInputState({
                type: 'loadedChapter:focusHistoryIndex',
                payload,
              });
            }}
            onHistoryNotationDelete={(payload) => {
              dispatchInputState({
                type: 'loadedChapter:deleteHistoryMove',
                payload,
              });
            }}
            onImport={(payload) => {
              // TODO: This is retarded - having to check and then send the exact same thing :)
              if (payload.type === 'FEN') {
                dispatchInputState({ type: 'import', payload });
              } else {
                dispatchInputState({ type: 'import', payload });
              }
            }}
            onCreateChapter={() => {
              if (inputState.isActive) {
                dispatchInputState({
                  type: 'createChapter',
                  payload: inputState.chapterState,
                });
              }
            }}
            onUpdateChapter={(id) => {
              if (inputState.isActive) {
                dispatchInputState({
                  type: 'updateChapter',
                  payload: {
                    id,
                    state: inputState.chapterState,
                  },
                });
              }
            }}
            onDeleteChapter={(id) => {
              dispatchInputState({
                type: 'deleteChapter',
                payload: { id },
              });
            }}
            onLoadChapter={(id) => {
              dispatchInputState({
                type: 'loadChapter',
                payload: { id },
              });
            }}
            onQuickImport={(payload) => {
              dispatchInputState({
                type: 'loadedChapter:import',
                payload,
              });
            }}
          /> */}
          {/* {currentChapter.name} */}

          {/* <WidgetPanel
            currentChapterState={currentChapter}
            chaptersMap={remoteState?.chaptersMap || {}}
            inputModeState={inputState}
            chaptersMapIndex={remoteState?.chaptersIndex || 0}
            currentLoadedChapterId={remoteState?.loadedChapterId}
            ref={tabsRef}
            onActivateInputMode={(payload) => {
              dispatchInputState({ type: 'activate', payload });
            }}
            onDeactivateInputMode={() => {
              dispatchInputState({ type: 'deactivate' });
            }}
            onUpdateInputModeState={(payload) => {
              dispatchInputState({ type: 'update', payload });
            }}
            onHistoryNotationRefocus={(payload) => {
              dispatch({
                type: 'loadedChapter:focusHistoryIndex',
                payload,
              });
            }}
            onHistoryNotationDelete={(payload) => {
              dispatch({
                type: 'loadedChapter:deleteHistoryMove',
                payload,
              });
            }}
            onImport={(payload) => {
              // TODO: This is retarded - having to check and then send the exact same thing :)
              if (payload.type === 'FEN') {
                dispatchInputState({ type: 'import', payload });
              } else {
                dispatchInputState({ type: 'import', payload });
              }
            }}
            onCreateChapter={() => {
              if (state.isActive) {
                dispatch({
                  type: 'createChapter',
                  payload: state.chapterState,
                });
              }
            }}
            onUpdateChapter={(id) => {
              if (state.isActive) {
                dispatch({
                  type: 'updateChapter',
                  payload: {
                    id,
                    state: state.chapterState,
                  },
                });
              }
            }}
            onDeleteChapter={(id) => {
              dispatch({
                type: 'deleteChapter',
                payload: { id },
              });
            }}
            onLoadChapter={(id) => {
              dispatch({
                type: 'loadChapter',
                payload: { id },
              });
            }}
            onQuickImport={(payload) => {
              dispatch({
                type: 'loadedChapter:import',
                payload,
              });
            }}
          /> */}
        </div>
      }
    />
  );
};
