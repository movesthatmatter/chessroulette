import { ChessFENBoard } from '@/lib/ChessFENBoard';
import { FreeBoardHistory } from '@/lib/FreeBoardHistory';
import type { Chapter, ChapterState, LearnActivityState } from './types';

export const initialChapterState: ChapterState = {
  name: 'New Chapter', // TODO: Should it have a name?
  displayFen: ChessFENBoard.STARTING_FEN,
  arrowsMap: {},
  circlesMap: {},
  notation: {
    history: [],
    focusedIndex: FreeBoardHistory.getStartingIndex(),
    startingFen: ChessFENBoard.STARTING_FEN,
  },
  orientation: 'w',
};

// export const initialFreeChapter = { ...initialChapterState, name: '' };

export const initialDefaultChapter: Chapter = {
  ...initialChapterState,
  name: 'Chapter 1',
  id: '0',
};

export const initialLearnStateActivityState: LearnActivityState['activityState'] =
  {
    chaptersMap: {
      [initialDefaultChapter.id]: initialDefaultChapter,
    },
    loadedChapterId: initialDefaultChapter.id,
    chaptersIndex: 1,
  };

export const initialLearnActivityState: LearnActivityState = {
  activityType: 'learn',
  activityState: initialLearnStateActivityState,
};
