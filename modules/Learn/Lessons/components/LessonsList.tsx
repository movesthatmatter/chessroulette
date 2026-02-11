// 'use client';

import Link from 'next/link';
import { LessonModel } from '../types';
import { LessonItem } from './LessonItem';
import { CustomSession } from '@/services/Auth';
import { getLearnRoutes_WITH_UNSAFE_SESSION_IN_URL } from '../links';

type Props = {
  lessons: LessonModel[];
  session: CustomSession;
};

export const LessonsList = ({ lessons, session }: Props) => {
  const learnRoutesUrls = getLearnRoutes_WITH_UNSAFE_SESSION_IN_URL(session);

  return (
    <div className="">
      <header className="pb-4">
        <div className="text-white">Lessons ({lessons.length})</div>
      </header>
      <div className="flex gap-4">
        {lessons.map((lesson) => (
          // <div id={lesson.id} key={lesson.id}>
          //   {lesson.name}

          //   <pre>{JSON.stringify(lesson, null, 2)}</pre>
          // </div>
          <Link
            key={lesson.id}
            href={learnRoutesUrls.newLesson(lesson.id)}
            className="w-1/4 block"
          >
            <LessonItem key={lesson.id} lesson={lesson} />
          </Link>
        ))}
      </div>
    </div>
  );
};
