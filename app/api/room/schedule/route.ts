import z from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { activityParamsSchema } from '@/modules/Room/io/paramsSchema';
import { links } from '@/modules/Room/links';
import { getRandomStr, objectOmit } from '@/lib/misc';
// import { getRandomStr } from '@/util';

const paramsSchema = z
  .object({
    // TODO: this can be used later when they hit the api, now just the op prefixed id
    client: z.string(), // Outpost
  })
  .and(activityParamsSchema);

export function GET(request: NextRequest) {
  const params = new URLSearchParams(request.nextUrl.search);
  const result = paramsSchema.safeParse(Object.fromEntries(params));

  if (!result.success) {
    return NextResponse.json(result.error, { status: 400 });
  }

  const activityParams = result.data;
  const roomId = activityParams.client.slice(0, 3) + getRandomStr(7);

  if (activityParams.activity === 'learn') {
    const instructor = links.getOnDemandRoomCreationLink(
      {
        ...objectOmit(activityParams, ['client']),
        id: roomId,
        instructor: true,
      },
      request.nextUrl
    );

    const student = links.getOnDemandRoomCreationLink(
      {
        ...objectOmit(activityParams, ['client']),
        id: roomId,
        instructor: false,
      },
      request.nextUrl
    );

    return NextResponse.json({
      links: [
        {
          userRole: 'instructor',
          url: instructor,
        },
        {
          userRole: 'student',
          url: student,
        },
      ],
    });
  }

  if (activityParams.activity === 'meetup') {
    return NextResponse.json({
      links: [
        {
          userRole: 'star',
          url: links.getOnDemandRoomCreationLink(
            {
              ...objectOmit(activityParams, ['client']),
              star: '1',
              id: roomId,
            },
            request.nextUrl
          ),
        },
        {
          userRole: 'fan',
          url: links.getOnDemandRoomCreationLink(
            {
              ...objectOmit(activityParams, ['client']),
              id: roomId,
            },
            request.nextUrl
          ),
        },
      ],
    });
  }

  if (activityParams.activity === 'match') {
    if (
      activityParams.type === 'bestOf' &&
      !(
        activityParams.rounds &&
        activityParams.rounds > 0 &&
        activityParams.rounds % 2 !== 0
      )
    ) {
      return NextResponse.json(
        {
          Error: 'Invalid number of rounds for BestOf',
        },
        {
          status: 500,
        }
      );
    }
    return NextResponse.json({
      links: [
        {
          userRole: 'challenger',
          url: links.getOnDemandRoomCreationLink(
            {
              ...objectOmit(activityParams, ['client']),
              id: roomId,
              challenger: 1, // TODO: This can be stored in movex better
            },
            request.nextUrl
          ),
          matchId: roomId,
        },
        {
          userRole: 'challengee',
          url: links.getOnDemandRoomCreationLink(
            {
              ...objectOmit(activityParams, ['client']),
              id: roomId,
            },
            request.nextUrl
          ),
          matchId: roomId,
        },
      ],
    });
  }

  return NextResponse.json(
    {
      Error: `Ooops! This shouldn't happen.`,
    },
    { status: 500 }
  );
}
