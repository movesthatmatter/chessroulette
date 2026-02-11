import { Metadata } from 'next';
import { metadata as rootMetadata } from '../../../../page';
import { RoomPage } from '@/modules/Room/RoomPage';
import { StringRecord } from '@/lib/misc';

export const metadata: Metadata = {
  title: `Match | ${rootMetadata.title}`,
};

export default async function Page(props: {
  params: StringRecord;
  searchParams: Partial<{ theme: string }>;
}) {
  return <RoomPage activity="match" {...props} />;
}
