import { Metadata } from 'next';
import { StringRecord } from '@/lib/misc';
import { metadata as rootMetadata } from '../../../../page';
import { RoomPage } from '@/modules/Room/RoomPage';

export const metadata: Metadata = {
  title: `Meetup | ${rootMetadata.title}`,
};

export default async function Page(props: {
  params: StringRecord;
  searchParams: Partial<{ theme: string }>;
}) {
  return <RoomPage activity="meetup" {...props} />;
}
