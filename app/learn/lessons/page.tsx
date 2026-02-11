import z from 'zod';
import { Metadata } from 'next';
import { findUserLessons } from '../../../modules/Learn/Lessons/apiActions';
import { User } from '@/modules/User';
import { LessonsList } from '@/modules/Learn/Lessons/components/LessonsList';
import { get_UNSAFE_URL_SESSION } from '@/services/Auth/lib';
import { GeneralPageTemplate } from '@/templates/GeneralPageTemplate';

export const metadata: Metadata = {
  title: 'Lessons | Chessroulette',
  description: '',
};

const paramsSchema = z.object({
  tag: z.string().optional(),
});

export default async function LessonsPage({
  searchParams,
  params,
}: {
  searchParams: Record<string, string>;
  params: Record<string, string>;
}) {
  const allParams = Object.assign(searchParams, params);

  const result = paramsSchema.safeParse(
    Object.fromEntries(new URLSearchParams(allParams))
  );

  const getLessons = (user: User) => {
    return findUserLessons({
      userId: user.id,
      query: result.success ? result.data : {},
    });
  };

  const session = await get_UNSAFE_URL_SESSION(searchParams);

  if (!session) {
    return <div>No User</div>;
  }

  return (
    <GeneralPageTemplate session={session}>
      <>
        {allParams && (
          <div className="pb-2">
            Params:
            {JSON.stringify(allParams, null, 2)}
          </div>
        )}

        <LessonsList
          lessons={await getLessons(session.user)}
          session={session}
        />
      </>
    </GeneralPageTemplate>
  );
}
