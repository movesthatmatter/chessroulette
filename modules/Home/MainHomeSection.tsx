import React from 'react';
import { Session } from 'next-auth';
import { Button } from '@/components/Button';
import { links } from '../Room/links';
import Image from 'next/image';
import darkSplashGraphic from './assets/dark_splash.svg';
import Link from 'next/link';
import { Progress } from '@heroui/progress';
import { Button as HeroButton } from '@heroui/button';
// import {} from "@heroui/react";

type Props = {
  session?: Session;
  className?: string;
};

export const MainHomeSection: React.FC<Props> = ({ className }) => {
  return (
    <main
      className={`flex flex-1 justify-center items-center gap-2
        pl-[max(env(safe-area-inset-left),1.5rem)]
        pr-[max(env(safe-area-inset-right),1.5rem)]
        ${className}`}
    >
      <div className="flex gap-10 flex-col md:flex-row">
        <div className="flex flex-col flex-1 gap-10 py-4 justify-center text-center md:text-left">
          <div>
            <h2 className="font-black text-5xl sm:text-6xl md:text-7xl md:mb-4">
              We are back!😎
            </h2>
            <h3 className="font-thin text-3xl sm:text-4xl md:text-5xl">
              And we are open source.
            </h3>
            <Progress aria-label="Loading..." className="max-w-md" value={60} />
          </div>
          <div className="flex gap-4 bg-red-100s justify-center md:justify-start">
            <Link
              href={links.getOnDemandRoomCreationLink({
                activity: 'meetup',
                star: '1', // TODO: Would be better to type it
              })}
            >
              {/* <Button type="primary" className="font-bold w-full">
                Connect
              </Button> */}
              <HeroButton color="primary">Connect</HeroButton>
            </Link>
            <Link
              href={links.getOnDemandRoomCreationLink({
                activity: 'learn',
                instructor: true,
              })}
            >
              <Button type="primary" className="font-bold w-full">
                Play A Friend
              </Button>
            </Link>
            <Link
              href={links.getOnDemandRoomCreationLink({
                activity: 'learn',
                instructor: true,
              })}
            >
              <Button type="primary" className="font-bold w-full">
                Start Roulette
              </Button>
            </Link>
            <Link
              href={links.getOnDemandRoomCreationLink({
                activity: 'learn',
                instructor: true,
              })}
            >
              <Button type="primary" className="font-bold w-full">
                Study
              </Button>
            </Link>
          </div>
        </div>
        <Image
          src={darkSplashGraphic}
          alt="Chessroulette Graphic"
          width={520}
        />
      </div>
    </main>
  );
};
