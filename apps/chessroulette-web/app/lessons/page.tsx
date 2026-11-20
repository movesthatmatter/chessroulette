import { Metadata } from 'next';
import Header from '../../components/Header/Header';
import { DailyLessonsSection } from '../../modules/Home/DailyLessonsSection';
import { authOptions } from '../../services/Auth';
import { getCustomServerSession } from '../../services/Auth/getCustomServerSession';
import Footer from '@app/components/Footer';
import { metadata as rootMetadata } from '../page';

export const metadata: Metadata = {
  title: `Lessons | ${rootMetadata.title}`,
};

export default async function LessonsPage() {
  const session = await getCustomServerSession(authOptions);
  return (
    <div className="flex flex-col h-full container mx-auto">
      <Header showOnboarding session={session} />
      <DailyLessonsSection levelLabel="Level 0–600" />
      <Footer />
    </div>
  );
}
