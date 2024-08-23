'use client';

import { MovexBoundResource, MovexConnection } from 'movex-react';
import { config } from '../config';
import movexConfig from '../movex.config';
import { pluralize } from '@xmatter/util-kit';
import { Menu, Item, useContextMenu } from 'react-contexify';
import { movexSubcribersToUserMap } from '../providers/MovexProvider';
import { useRoomDetails } from '../modules/room/hooks';

const MENU_ID = 'movex-participants-menu';

export default () => {
  const { show } = useContextMenu({ id: MENU_ID });
  const roomDetails = useRoomDetails();

  if (!roomDetails?.roomId) {
    return null;
  }

  return (
    <MovexConnection
      render={({ status, clientId }) => (
        <div className="text-sm text-slate-300 text-right text-slate-600 items-end justify-end">
          <div className="flex gap-1 text-right justify-end">
            {status === 'connected' ? (
              <span className="flex gap-1 items-center">
                Connected
                <span className="w-2 h-2 rounded-full bg-green-600 block" />
                {roomDetails.roomId && (
                  <MovexBoundResource
                    movexDefinition={movexConfig}
                    rid={`room:${roomDetails.roomId}`}
                    render={({ boundResource: { subscribers } }) => {
                      // const participants = Object.values(subscribers);

                      const participants = Object.values(
                        movexSubcribersToUserMap(subscribers)
                      );
                      const participantsCount = participants.length;

                      return (
                        <button
                          onClick={(event) => {
                            show({ event });
                          }}
                        >
                          ({participantsCount}{' '}
                          {pluralize(!(participantsCount === 1), 'participant')}
                          )
                          <Menu id={MENU_ID}>
                            {participants.map((p) => (
                              <Item key={p.id}>
                                {clientId === p.id
                                  ? `Me (${p.id})`
                                  : `${p.displayName || 'User'} (${p.id})`}
                              </Item>
                            ))}
                          </Menu>
                        </button>
                      );
                    }}
                  />
                )}
              </span>
            ) : (
              <span className="flex gap-1 items-center capitalize">
                {status}
                <span className="w-2 h-2 rounded-full bg-slate-600 block" />
              </span>
            )}
          </div>

          {config.DEBUG_MODE && <div>Movex Client: {clientId}</div>}
          {/* </div> */}
        </div>
      )}
    />
  );
};
