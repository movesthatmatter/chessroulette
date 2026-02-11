'use client';

import React from 'react';
import { Menu, Item, useContextMenu } from 'react-contexify';
import 'react-contexify/dist/ReactContexify.css';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { CustomSession } from '@/services/Auth';

type Props = React.PropsWithChildren & {
  session: CustomSession;
  containerClassName?: string;
};

const ONBOARDING_MENU_ID = 'onboarding';

export const OnboardingMenuContainer: React.FC<Props> = ({
  children,
  session,
}) => {
  const { show, hideAll } = useContextMenu({ id: ONBOARDING_MENU_ID });

  return (
    <div className="hover:cursor-pointer" onClick={(event) => show({ event })}>
      {children}
      <Menu id={ONBOARDING_MENU_ID}>
        {/* // Improve the Menu */}
        <Item>
          <span className="text-dark">{session.user.displayName}</span>
        </Item>
        <Item
          id="profile"
          className="hover:cursor-pointer"
        >
          <Link href="/profile" className="flex-1">
            Profile
          </Link>
        </Item>
        <Item
          id="delete"
          onClick={() => signOut()}
          className="hover:cursor-pointer"
        >
          Sign Out
        </Item>
      </Menu>
    </div>
  );
};
