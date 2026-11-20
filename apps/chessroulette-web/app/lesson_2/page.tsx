import { Metadata } from 'next';
import Header from '../../components/Header/Header';
import { DailyLessonsSection } from '../../modules/Home/DailyLessonsSection';
import { LESSON_DATABASE_2 } from '../../modules/Room/activities/DailyLesson/lessonDatabase';
import { authOptions } from '../../services/Auth';
import { getCustomServerSession } from '../../services/Auth/getCustomServerSession';
import { metadata as rootMetadata } from '../page';

export const metadata: Metadata = {
  title: `Lessons 600-1200 | ${rootMetadata.title}`,
};

export default async function Lessons2Page() {
  const session = await getCustomServerSession(authOptions);
  return (
    <div className="flex flex-col h-full container mx-auto">
      {/* lekcije se otvaraju sa theme=op, pa i stranica nosi Outpost izgled */}
      <Header themeName="op" session={session} />
      <DailyLessonsSection
        lessons={LESSON_DATABASE_2}
        levelLabel="Level 600–1200"
      />
    </div>
  );
}
