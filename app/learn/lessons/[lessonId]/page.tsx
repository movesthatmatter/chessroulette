import { Metadata } from 'next';
import { findLesson } from '@/modules/Learn/Lessons/apiActions';
import Header from '@/components/Header/Header';
import { UpdateLessonContainer } from '@/modules/Learn/Lessons/UpdateLessonContainer';
import { get_UNSAFE_URL_SESSION } from '@/services/Auth/lib';

export const metadata: Metadata = {
  title: 'Lessons | Chessroulette',
  description: '',
};

export default async function LessonPage({
  searchParams,
  params,
}: {
  searchParams: Record<string, string>;
  params: { lessonId: string };
}) {
  const session = await get_UNSAFE_URL_SESSION(searchParams);

  if (!session) {
    return <div>No User</div>;
  }

  const lesson = await findLesson(params);

  if (!lesson) {
    return <div>Should show error page</div>;
  }

  return (
    <div className="flex flex-col flex-1 w-full min-h-full">
      <Header showOnboarding session={session} />
      <div
        className={`
           ml-[max(env(safe-area-inset-left),1.5rem)]
           mr-[max(env(safe-area-inset-right),1.5rem)]
           mb-[max(env(safe-area-inset-right),2rem)]
           mt-2
           flex-1 relative overflow-hidden`}
      >
        <div className="absolute inset-0">
          <UpdateLessonContainer lesson={lesson} />
        </div>
      </div>
    </div>
  );
}
