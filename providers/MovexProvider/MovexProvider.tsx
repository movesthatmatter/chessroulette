'use client';

import React, { useEffect } from 'react';
import { MovexProvider as NativeMovexProvider } from 'movex-react';
import { captureEvent, setUser as setSentryUser } from '@sentry/nextjs';
import { config } from '../../config';
import { useSessionUserOrSetAsGuest } from '../../modules/User/hooks';
import { CustomSession } from '../../services/Auth';
import movexConfig from '@/movex.config';
import { isOneOf } from '@/lib/misc';

export type Props = React.PropsWithChildren<{
  session?: CustomSession;
}>;

export const MovexProvider = React.memo(({ session, children }: Props) => {
  const user = useSessionUserOrSetAsGuest(session);

  useEffect(() => {
    setSentryUser(user);
  }, [user.id]);

  return (
    <NativeMovexProvider
      movexDefinition={movexConfig}
      endpointUrl={config.MOVEX_ENDPOINT_URL}
      clientId={user.id}
      clientInfo={{
        displayName: user.displayName,
      }}
      logger={{
        onLog(event) {
          if (config.DEBUG_MODE) {
            console[event.method](event.prefix, event.message, event.payload);
          }

          if (isOneOf(event.method, ['error', 'warn'])) {
            captureEvent({
              level: event.method === 'warn' ? 'warning' : event.method,
              message: event.prefix + ' | ' + String(event.message),
              environment: config.ENV,
              // TODO: add more info if needed, like the resource id at least so it can be checked in the store
              //  if not more relevant, timely stuff
              // extra: {}
            });
          }
        },
      }}
    >
      {children}
    </NativeMovexProvider>
  );
});
