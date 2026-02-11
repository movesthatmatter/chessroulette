import { PropsWithChildren } from 'react';
import { Awaitable } from 'next-auth';
import {
  CustomSession,
  authOptions,
  getCustomServerSession,
} from '../services/Auth';
import { GeneralPageTemplate } from '../templates';

type Props =
  | {
      render: (session: CustomSession, data: unknown) => React.ReactNode;
      resolveData?: (session: CustomSession) => Awaitable<unknown>;
      fallback?: React.ReactNode;
      children?: undefined;
    }
  | {
      render?: undefined;
      resolveData?: undefined;
      fallback?: undefined;
      children: PropsWithChildren['children'];
    };

export const AuthenticatedGeneralPage = async (props: Props) => {
  const session = await getCustomServerSession(authOptions);

  if (props.render) {
    return (
      <GeneralPageTemplate session={session}>
        {session
          ? props.render(session, await props.resolveData?.(session))
          : props.fallback}
      </GeneralPageTemplate>
    );
  }

  return (
    <GeneralPageTemplate session={session}>
      {session ? props.children : <div>You need to login</div>}
    </GeneralPageTemplate>
  );
};
