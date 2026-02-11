import { toDictIndexedBy } from '@/lib/misc';
import {
  Chapter,
  ChapterState,
  LessonState,
  initialLessonState,
} from './LessonEditor/draftLessonReducer';
import {
  ChapterCreateInput,
  ChapterModel,
  LessonCreateInput,
  LessonModel,
} from './types';

export const defaultLessonModel: LessonModel = {
  id: 'test-lesson-id',
  name: 'Test Lesson',
  createdBy: 'me',
  createdAt: new Date(2004, 23, 11),
  tags: [{ name: 'opening' }, { name: 'mate' }],
  chapters: [
    {
      id: 'chapter-1',
      name: 'Chapter 1',
      startingFen:
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w - - 0 1',
      createdAt: new Date(2004, 23, 11),
    },
  ],
};

// type LessonState = LearnActivityState['activityState'];

export const chapterModelToChapter = (chm: ChapterModel): Chapter => ({
  ...chm,
  // TODO: Populate from the real model once they are implemented
  notation: {
    history: [],
    startingFen: chm.startingFen,
    focusedIndex: [-1, 1],
  },
  displayFen: chm.startingFen,
  arrowsMap: {}, // TODO: Implement
  circlesMap: {}, // TODO: Implement
  orientation: 'w', // TODO: Take from the Fen?? or have it part of the chapter?
});

export const lessonModelToLessonState = (lm: LessonModel): LessonState => ({
  ...initialLessonState,
  name: lm.name,
  tags: lm.tags.map((t) => t.name),
  ...(lm.chapters.length > 0 && {
    loadedChapterId: lm.chapters[0].id,
    chaptersIndex: lm.chapters.length,
    chaptersMap: toDictIndexedBy(
      lm.chapters.map(chapterModelToChapter),
      (ch) => ch.id
    ),
  }),
});

export const chapterStateToChapterCreateInput = (
  chs: ChapterState
): ChapterCreateInput => ({
  name: chs.name,
  startingFen: chs.displayFen, // ToDO: will this stay as is?
  // TODO: add more as it comes
});

export const lessonStateToLessonCreateInput = (
  ls: LessonState
): LessonCreateInput => ({
  name: ls.name,
  tags: ls.tags.map((name) => ({ name })),
  chapters: Object.values(ls.chaptersMap).map(chapterStateToChapterCreateInput),
});
