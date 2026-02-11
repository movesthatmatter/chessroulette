import { Metadata } from 'next';
import { StringRecord } from '@/lib/misc';
import { JoinOrCreateRoom } from '@/modules/Room/components/JoinOrCreateRoom';
import { roomIdentifiableActivityParamsSchema } from '@/modules/Room/io/paramsSchema';
import { ErrorPage } from '@/appPages/ErrorPage';
import { metadata as rootMetadata } from '../../../page';

export const metadata: Metadata = {
  title: `Join Room | ${rootMetadata.title}`,
};

export default async function Page({
  searchParams,
  params,
}: {
  searchParams: StringRecord;
  params: StringRecord;
}) {
  const allParams = Object.assign(searchParams, params);
  const result = roomIdentifiableActivityParamsSchema.safeParse(
    Object.fromEntries(new URLSearchParams(allParams))
  );

  if (!result.success) {
    return <ErrorPage error={result.error} extra={allParams} />;
  }

  const { roomId, ...activityParams } = result.data;

  const nextParams = new URLSearchParams();

  Object.entries(activityParams).forEach(([k, v]) => {
    if (v) {
      nextParams.set(k, String(v));
    }
  });

  return (
    <JoinOrCreateRoom
      mode="join"
      roomId={roomId}
      activityParams={activityParams}
    />
  );
}
