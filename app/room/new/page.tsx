import { Metadata } from 'next';
import { JoinOrCreateRoom } from '@/modules/Room/components/JoinOrCreateRoom';
import { activityParamsSchema } from '@/modules/Room/io/paramsSchema';
import { ErrorPage } from '@/appPages/ErrorPage';
import { metadata as rootMetadata } from '../../page';

export const metadata: Metadata = {
  title: `New Room | ${rootMetadata.title}`,
};

export default async function Page({
  searchParams,
  params,
}: {
  searchParams: Record<string, string>;
  params: Record<string, string>;
}) {
  const allParams = Object.assign(searchParams, params);
  const result = activityParamsSchema.safeParse(
    Object.fromEntries(new URLSearchParams(allParams))
  );

  if (!result.success) {
    return <ErrorPage error={result.error} extra={allParams} />;
  }

  const activityParams = result.data;

  const nextParams = new URLSearchParams();

  Object.entries(activityParams).forEach(([k, v]) => {
    if (v) {
      nextParams.set(k, String(v));
    }
  });

  return <JoinOrCreateRoom mode="create" activityParams={activityParams} />;
}
