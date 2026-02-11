import { ChapterState } from '../movex';

// TODO: Ensure this is enough for proper equality
export const areChapterStatesEqual = (a: ChapterState, b: ChapterState) =>
  a.displayFen === b.displayFen &&
  a.name === b.name &&
  a.orientation === b.orientation &&
  // Shallow checks
  a.arrowsMap === b.arrowsMap &&
  a.circlesMap === b.circlesMap &&
  a.notation === b.notation;
