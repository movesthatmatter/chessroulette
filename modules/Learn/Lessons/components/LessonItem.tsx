// import { Lesson } from '@prisma/client';
import { LessonModel } from '../types';

type Props = {
  lesson: LessonModel;
  className?: string;
};

export const LessonItem = ({ lesson, className }: Props) => {
  return (
    <div className={`p-3 bg-slate-700 rounded-xl ${className}`}>
      <h4>{lesson.name}</h4>
      <p>{lesson.createdAt.toLocaleDateString()}</p>
      <div>Chapters {lesson.chapters.length}</div>
    </div>
  );
};
