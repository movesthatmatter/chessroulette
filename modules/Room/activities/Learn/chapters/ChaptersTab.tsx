import { useMemo } from 'react';
import { objectKeys } from 'movex-core-util';
import { ChapterItem } from './ChapterItem';
import { Button, IconButton } from '@/components/Button';
import { CreateChapterView } from './views/CreateChapterView';
import { TabsNav } from '@/components/Tabs';
import { UpdateChapterView } from './views/UpdateChapterView';
import { EditChapterStateViewProps } from './views/EditChapterStateView';
import { initialChapterState } from '../movex/state';
import { Chapter, ChapterState,  } from '../movex/types';

export type ChaptersTabProps = {
  chaptersMap: Record<Chapter['id'], Chapter>;
  chaptersMapIndex: number; // The number of chapters in the whole state
  currentLoadedChapterId: Chapter['id'];
  className?: string;
  tabsNav: TabsNav;

  // Input Mode
  onActivateInputMode: (s: {
    isBoardEditorShown?: boolean;
    chapterState: ChapterState; // Create or Update Chapter but it will come here!
  }) => void;
  onDeactivateInputMode: () => void;
  onUpdateInputModeState: (
    s: Partial<{
      chapterState: ChapterState;
      isBoardEditorShown?: boolean;
    }>
  ) => void;
  onImportInput: EditChapterStateViewProps['onImport'];
  inputModeState: { chapterState?: ChapterState; isBoardEditorShown?: boolean };

  // Chapters Logistics
  onCreateChapter: () => void;
  onUpdateChapter: (id: Chapter['id']) => void;
  onDeleteChapter: (id: Chapter['id']) => void;
  onLoadChapter: (id: Chapter['id']) => void;
};

export const ChaptersTab = ({
  onCreateChapter,
  onUpdateChapter,
  onDeleteChapter,
  onLoadChapter,
  onImportInput,

  chaptersMapIndex,
  currentLoadedChapterId,
  chaptersMap,
  className,
  tabsNav,
  ...props
}: ChaptersTabProps) => {
  const chaptersList = useMemo(
    () => objectKeys(chaptersMap).map((id) => chaptersMap[id]),
    [chaptersMap]
  );

  return (
    <div className={`flex flex-col w-full ${className}`}>
      {
        [
          <>
            {chaptersList.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-500">
                Wow, So Empty!
              </div>
            ) : (
              <div className="flex-1 overflow-scroll">
                {chaptersList.map((chapter) => (
                  <ChapterItem
                    key={chapter.id}
                    isActive={currentLoadedChapterId === chapter.id}
                    chapter={chapter}
                    onLoadClick={() => onLoadChapter(chapter.id)}
                    onEditClick={() => {
                      // setUpdatingChapterId(chapter.id);
                      tabsNav.stackTo(2);
                      props.onActivateInputMode({ chapterState: chapter });
                    }}
                    onDeleteClick={() => onDeleteChapter(chapter.id)}
                  />
                ))}
              </div>
            )}
            <Button
              size="sm"
              className="mt-4"
              icon="PlusIcon"
              onClick={() => {
                tabsNav.stackPush();
                props.onActivateInputMode({
                  chapterState: {
                    ...initialChapterState,
                    name: `Chapter ${chaptersMapIndex + 1}`,
                  },
                });
              }}
            >
              Add New Chapter
            </Button>
          </>,

          // CREATE CHAPTER TAB
          <div className="flex-1 flex overflow-scroll">
            {props.inputModeState.chapterState && (
              <div className="flex flex-col">
                <div className="flex flex-1 flex-col gap-3 overflow-scroll">
                  <CreateChapterView
                    onToggleBoardEditor={(show) =>
                      props.onUpdateInputModeState({
                        isBoardEditorShown: show,
                      })
                    }
                    isBoardEditorShown={
                      !!props.inputModeState.isBoardEditorShown
                    }
                    state={props.inputModeState.chapterState}
                    onUpdate={(nextChapterState) =>
                      props.onUpdateInputModeState({
                        chapterState: nextChapterState,
                      })
                    }
                    onImport={onImportInput}
                  />
                </div>

                <div className="flex gap-2 mt-4">
                  <IconButton
                    size="sm"
                    type="secondary"
                    onClick={() => {
                      tabsNav.stackBack();
                      props.onUpdateInputModeState({
                        ...props.inputModeState,
                        isBoardEditorShown: false,
                      });
                      props.onDeactivateInputMode();
                    }}
                    icon="ArrowLeftIcon"
                  />
                  <Button
                    className="flex-1"
                    size='sm'
                    onClick={() => {
                      onCreateChapter();
                      // Go back
                      tabsNav.stackPop();
                      props.onUpdateInputModeState({
                        ...props.inputModeState,
                        isBoardEditorShown: false,
                      });
                      props.onDeactivateInputMode();
                    }}
                    icon="PlusIcon"
                  >
                    Create Chapter
                  </Button>
                </div>
              </div>
            )}
          </div>,
          // UPDATE CHAPTER TAB
          <div className="flex-1 flex overflow-scroll">
            {props.inputModeState.chapterState && (
              <UpdateChapterView
                onToggleBoardEditor={(show) =>
                  props.onUpdateInputModeState({
                    isBoardEditorShown: show,
                  })
                }
                isBoardEditorShown={!!props.inputModeState.isBoardEditorShown}
                state={props.inputModeState.chapterState}
                onUpdate={(nextChapterState) =>
                  props.onUpdateInputModeState({
                    chapterState: nextChapterState,
                  })
                }
                renderSubmit={({ hasInputChanged }) => (
                  <div className="flex gap-2 mt-4">
                    <IconButton
                      // size="sm"
                      type="secondary"
                      onClick={() => {
                        tabsNav.stackPop();
                        props.onDeactivateInputMode();
                      }}
                      title="Cancel Changes"
                      icon="ArrowLeftIcon"
                    />
                    <Button
                      className="flex-1"
                      // size="sm"
                      disabled={!hasInputChanged}
                      onClick={() => {
                        onUpdateChapter(currentLoadedChapterId);

                        // Go back
                        tabsNav.stackPop();

                        props.onUpdateInputModeState({
                          ...props.inputModeState,
                          isBoardEditorShown: false,
                        });
                        props.onDeactivateInputMode();
                      }}
                      icon="PencilSquareIcon"
                    >
                      Update Chapter
                    </Button>
                  </div>
                )}
                onImport={onImportInput}
              />
            )}
          </div>,
        ][tabsNav.stackIndex]
      }
    </div>
  );
};
