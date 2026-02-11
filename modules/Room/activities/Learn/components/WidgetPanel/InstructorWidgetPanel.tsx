import React, { useCallback, useMemo } from 'react';
import { Button } from '@/components/Button';
import {
  FreeBoardNotation,
  FreeBoardNotationProps,
} from '@/components/FreeBoardNotation';
import { Tabs, TabsRef } from '@/components/Tabs';
import type { Chapter, ChapterState } from '../../movex/types';
import {
  PgnInputBox,
  PgnInputBoxProps,
} from '@/components/PgnInputBox/PgnInputBox';
import { ChaptersTab, ChaptersTabProps } from '../../chapters/ChaptersTab';
import { useWidgetPanelTabsNavAsSearchParams } from '../useWidgetPanelTabsNav';
import { EngineData } from '../../../../../ChessEngine/lib/io';
import { useUpdateableSearchParams } from '@/hooks/useSearchParams';
import { ChessEngineWithProvider } from '@/modules/ChessEngine/ChesEngineWithProvider';
import { Switch } from '@/components/Switch';

type Props = {
  chaptersMap: Record<Chapter['id'], Chapter>;
  chaptersMapIndex: number;
  currentChapterState: ChapterState;

  // Board
  onImport: PgnInputBoxProps['onChange'];
  onQuickImport: PgnInputBoxProps['onChange'];

  onHistoryNotationRefocus: FreeBoardNotationProps['onRefocus'];
  onHistoryNotationDelete: FreeBoardNotationProps['onDelete'];

  // Engine
  showEngine?: boolean;
  // engine?: EngineData;
} & Pick<
  ChaptersTabProps,
  | 'onLoadChapter'
  | 'onCreateChapter'
  | 'onDeleteChapter'
  | 'onUpdateChapter'
  | 'onUpdateInputModeState'
  | 'inputModeState'
  | 'onActivateInputMode'
  | 'onDeactivateInputMode'
  | 'currentLoadedChapterId'
>;

export const InstructorWidgetPanel = React.forwardRef<TabsRef, Props>(
  (
    {
      chaptersMap,
      chaptersMapIndex,
      currentLoadedChapterId,
      currentChapterState,
      // engine,
      showEngine,
      onImport,
      onQuickImport,
      onHistoryNotationDelete,
      onHistoryNotationRefocus,
      ...chaptersTabProps
    },
    tabsRef
  ) => {
    // const settings = useLearnActivitySettings();
    const widgetPanelTabsNav = useWidgetPanelTabsNavAsSearchParams();
    const updateableSearchParams = useUpdateableSearchParams();

    const currentTabIndex = useMemo(
      () => widgetPanelTabsNav.getCurrentTabIndex(),
      [widgetPanelTabsNav.getCurrentTabIndex]
    );

    const onTabChange = useCallback(
      (p: { tabIndex: number }) => {
        widgetPanelTabsNav.setTabIndex(p.tabIndex);
      },
      [widgetPanelTabsNav.setTabIndex]
    );

    // useEffect(() => {
    //   console.log('widgetPanelTabsNav changed');
    // }, [widgetPanelTabsNav]);

    // Instructor
    return (
      <Tabs
        containerClassName="bg-slate-700 p-3 flex flex-col flex-1 min-h-0 rounded-lg shadow-2xl"
        headerContainerClassName="flex gap-3 pb-3"
        contentClassName="flex-1 flex min-h-0 pt-2"
        currentIndex={currentTabIndex}
        onTabChange={onTabChange}
        renderContainerHeader={({ tabs }) => (
          <div className="flex flex-row gap-3 pb-3 border-b border-slate-600">
            {tabs}
            {/* // Only show the Engine switch on the notation tab */}
            {currentTabIndex === 0 && (
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
            )}
          </div>
        )}
        ref={tabsRef}
        tabs={[
          {
            id: 'notation',
            renderHeader: (p) => (
              <Button
                onClick={() => {
                  p.focus();
                  chaptersTabProps.onDeactivateInputMode();
                }}
                size="sm"
                className={`bg-slate-600 font-bold hover:bg-slate-800 ${
                  p.isFocused && 'bg-slate-800'
                }`}
              >
                Notation
              </Button>
            ),
            renderContent: () => (
              <div className="flex flex-col flex-1 gap-2 min-h-0">
                {showEngine && (
                  <ChessEngineWithProvider
                    gameId={currentLoadedChapterId}
                    fen={currentChapterState.displayFen}
                    canAnalyze
                    onToggle={(s) =>
                      updateableSearchParams.set({ engine: Number(s) })
                    }
                  />
                )}
                <FreeBoardNotation
                  history={currentChapterState.notation?.history}
                  focusedIndex={currentChapterState.notation?.focusedIndex}
                  onDelete={onHistoryNotationDelete}
                  onRefocus={onHistoryNotationRefocus}
                />
                {/* <FenPreview fen={currentChapterState.displayFen} /> */}
                <div className="flex flex-col sitems-center gap-3">
                  <label className="font-bold text-sm text-gray-400">
                    Quick Import
                  </label>
                  <PgnInputBox
                    compact
                    containerClassName="flex-1"
                    onChange={onQuickImport}
                  />
                </div>
              </div>
            ),
          },
          {
            id: 'chapters',
            renderHeader: (p) => (
              <Button
                onClick={() => {
                  p.focus();
                  chaptersTabProps.onDeactivateInputMode();
                }}
                size="sm"
                className={`bg-slate-600 font-bold hover:bg-slate-800 ${
                  p.isFocused && 'bg-slate-800'
                }`}
              >
                Chapters ({Object.keys(chaptersMap).length})
              </Button>
            ),
            renderContent: (p) => (
              <ChaptersTab
                chaptersMap={chaptersMap}
                chaptersMapIndex={chaptersMapIndex}
                currentLoadedChapterId={currentLoadedChapterId}
                className="min-h-0"
                tabsNav={p.nav}
                onImportInput={onImport}
                {...chaptersTabProps}
              />
            ),
          },
        ]}
      />
    );
  }
);
