import { ResourceIdentifier } from 'movex-core-util';
import { StringRecord } from '@/lib/misc';
import { authOptions, getCustomServerSession } from '@/services/Auth';
import { twilio } from '@/services/twilio';
import { ErrorPage } from '@/appPages/ErrorPage';
import { RoomContainer } from './RoomContainer';
import { RoomTemplate } from './RoomTemplate';
import { roomIdParamsSchema } from './io/paramsSchema';
import { ActivityState } from './activities/movex';

export async function RoomPage({
  params,
  searchParams,
  activity,
}: {
  params: StringRecord;
  searchParams: Partial<{ theme: string }>;
  activity: ActivityState['activityType'];
}) {
  const result = roomIdParamsSchema.safeParse(
    Object.fromEntries(new URLSearchParams(params))
  );

  if (!result.success) {
    return <ErrorPage error={result.error} extra={params} />;
  }

  const session = (await getCustomServerSession(authOptions)) || undefined;
  const iceServers = await twilio.getIceServers();
  const roomId = decodeURIComponent(result.data.roomId);
  const rid: ResourceIdentifier<'room'> = `room:${roomId}`;

  return (
    <RoomTemplate
      themeName={searchParams.theme}
      session={session}
      roomId={roomId}
      activity={activity}
    >
      {/* // TODO: Here can show suspense with loading of a none room or smtg for server rendering! */}
      <RoomContainer rid={rid} iceServers={iceServers} activity={activity} />
    </RoomTemplate>
  );
}
