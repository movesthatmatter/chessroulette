import { CustomSession } from '@/services/Auth';
import { sessionToSearchParams } from '@/services/Auth/lib';

// const root = '/';
const learn = '/learn';
const lessons = `${learn}/lessons`;

export const learnRoutes = {
  learn,
  lessons,
  newLesson: (id: string) => `${lessons}/${id}`,
};

export const getLearnRoutes_WITH_UNSAFE_SESSION_IN_URL = (
  session: CustomSession
) => {
  const paramsStr = new URLSearchParams(
    sessionToSearchParams(session)
  ).toString();

  return {
    learn: `${learnRoutes.learn}?${paramsStr}`,
    lessons: `${learnRoutes.lessons}?${paramsStr}`,
    newLesson: (id: string) => `${learnRoutes.newLesson(id)}?${paramsStr}`,
  };
};
