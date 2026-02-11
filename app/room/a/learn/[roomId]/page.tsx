import { Metadata } from 'next';
import { RoomPage } from '@/modules/Room/RoomPage';
import { metadata as rootMetadata } from '../../../../page';
import { StringRecord } from '@/lib/misc';

export const metadata: Metadata = {
  title: `Room | ${rootMetadata.title}`,
};

export default async function Page(props: {
  params: StringRecord;
  searchParams: Partial<{ theme: string }>;
}) {
  return <RoomPage activity="learn" {...props} />;

  // const result = roomIdParamsSchema.safeParse(
  //   Object.fromEntries(new URLSearchParams(params))
  // );

  // if (!result.success) {
  //   return <ErrorPage error={result.error} extra={params} />;
  // }

  // const session = (await getCustomServerSession(authOptions)) || undefined;
  // const iceServers = await twilio.getIceServers();
  // const roomId = decodeURIComponent(result.data.roomId);
  // const rid: ResourceIdentifier<'room'> = `room:${roomId}`;

  // return (
  //   <RoomTemplate
  //     themeName={searchParams.theme}
  //     session={session}
  //     roomId={roomId}
  //     activity="learn"
  //   >
  //     {/* // TODO: Here can show suspense with loading of a none room or smtg for server rendering! */}
  //     <RoomContainer rid={rid} iceServers={iceServers} activity="learn" />
  //   </RoomTemplate>
  // );
}
