import {
  FreeBoardNotation,
  FreeBoardNotationProps,
} from '@/components/FreeBoardNotation';
import { TabsRef } from '@/components/Tabs';
import { Chapter, ChapterState } from '../../movex';
import { PgnInputBoxProps } from '@/components/PgnInputBox/PgnInputBox';
import { ChaptersTabProps } from '../../chapters/ChaptersTab';
import React from 'react';
import { EngineData } from '../../../../../ChessEngine/lib/io';
import { InstructorWidgetPanel } from './InstructorWidgetPanel';

type Props = {
  chaptersMap: Record<Chapter['id'], Chapter>;
  chaptersMapIndex: number;
  currentChapterState: ChapterState;

  // Board
  onImport: PgnInputBoxProps['onChange'];
  onQuickImport: PgnInputBoxProps['onChange'];

  onHistoryNotationRefocus: FreeBoardNotationProps['onRefocus'];
  onHistoryNotationDelete: FreeBoardNotationProps['onDelete'];

  // Mode
  isInstructor: boolean;

  // Engine
  showEngine?: boolean;
  engine?: EngineData;
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

export const WidgetPanel = React.forwardRef<TabsRef, Props>(
  (
    {
      chaptersMap,
      chaptersMapIndex,
      currentLoadedChapterId,
      currentChapterState,
      showEngine,
      engine,
      isInstructor,
      onImport,
      onQuickImport,
      onHistoryNotationDelete,
      onHistoryNotationRefocus,
      ...chaptersTabProps
    },
    tabsRef
  ) => {
    // Instructor
    if (isInstructor) {
      return (
        <InstructorWidgetPanel
          onHistoryNotationDelete={onHistoryNotationDelete}
          onHistoryNotationRefocus={onHistoryNotationRefocus}
          currentChapterState={currentChapterState}
          currentLoadedChapterId={currentLoadedChapterId}
          onQuickImport={onQuickImport}
          onImport={onImport}
          chaptersMap={chaptersMap}
          chaptersMapIndex={chaptersMapIndex}
          showEngine={showEngine}
          ref={tabsRef}
          {...chaptersTabProps}
        />
      );
    }

    // Student
    return (
      <div className="bg-slate-700 p-3 flex flex-col flex-1 min-h-0 rounded-lg shadow-2xl">
        <FreeBoardNotation
          history={currentChapterState.notation?.history}
          focusedIndex={currentChapterState.notation?.focusedIndex}
          onDelete={onHistoryNotationDelete}
          onRefocus={onHistoryNotationRefocus}
        />
      </div>
    );
  }
);
