// Models

import { IdentifiableRecord } from '@/lib/misc';

export type LessonModel = {
  id: string;
  name: string;
  createdBy: string; // user id
  createdAt: Date;
  tags: { name: string }[];
  chapters: ChapterModel[];
};

export type ChapterModel = {
  id: string;
  name: string;
  startingFen: string;
  createdAt: Date;
};

// Inputs

// Creation Inputs

export type ChapterCreateInput = {
  name: string;
  startingFen: string;
};

export type LessonCreateInput = {
  name: string;
  // createdBy: string; // user id
  tags: { name: string }[];
  chapters: ChapterCreateInput[];
};

// Updating Inputs

export type ChapterUpdateInput = IdentifiableRecord<ChapterCreateInput>;
export type LessonUpdateInput = IdentifiableRecord<LessonCreateInput>;
