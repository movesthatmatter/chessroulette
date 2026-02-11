import { RoomState } from '@/modules/Room/movex';
import { MovexClientResourceShape } from 'movex-core-util';
import { NextRequest, NextResponse } from 'next/server';

const env = process.env.NEXT_PUBLIC_ENV;
const HTTP_PROTOCOL = env === 'staging' || env === 'prod' ? 'https' : 'http';
const MOVEX_ENDPOINT_URL = process.env.NEXT_PUBLIC_MOVEX_ENDPOINT_URL as string;

export function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const movexRoomUrl = `${HTTP_PROTOCOL}://${MOVEX_ENDPOINT_URL}/api/resources/room:${params.id}/state`;

  return fetch(movexRoomUrl, { cache: 'no-store' })
    .then((s) => {
      if (!s.ok) {
        throw s;
      }

      return s.json();
    })
    .then(
      ([room]: MovexClientResourceShape<string, RoomState>['state']) => {
        if (room.activity.activityType === 'match') {
          return NextResponse.json(room.activity.activityState);
        }

        return NextResponse.json(
          {
            Error: `Match Resource Not Found`,
          },
          { status: 404 }
        );
      },
      async (e: Response) => {
        if (e.statusText) {
          return NextResponse.json(
            {
              Error: e.statusText,
            },
            { status: e.status }
          );
        }

        return NextResponse.json(
          {
            Error: `Ooops! This shouldn't happen.`,
            payload: e,
          },
          { status: 500 }
        );
      }
    );
}
