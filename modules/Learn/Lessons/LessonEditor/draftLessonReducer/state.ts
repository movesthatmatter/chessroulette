import { ChessFENBoard } from '@/lib/ChessFENBoard';
import { FreeBoardHistory } from '@/lib/FreeBoardHistory';
import type { Chapter, ChapterState, LessonState } from './types';

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

/**
 * Note - this always has a loaded chapter in!
 */
export const initialLessonState: LessonState = {
  name: 'New Lesson',
  tags: [],
  chaptersMap: {
    [initialDefaultChapter.id]: initialDefaultChapter,
  },
  loadedChapterId: initialDefaultChapter.id,
  chaptersIndex: 1,
};
