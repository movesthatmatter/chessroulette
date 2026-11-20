import React from 'react';
import { Session } from 'next-auth';
import { Button } from '@app/components/Button';
import { links } from '../Room/links';
import Image from 'next/image';
import darkSplashGraphic from './assets/dark_splash.svg';
import Link from 'next/link';

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
          </div>
          <div className="flex gap-4 bg-red-100s justify-center md:justify-start">
            <Link
              href={links.getOnDemandRoomCreationLink({
                activity: 'meetup',
                star: '1', // TODO: Would be better to type it
              })}
            >
              <Button type="primary" className="font-bold w-full">
                Connect
              </Button>
            </Link>
            {/* <Link
              href={links.getOnDemandRoomCreationLink({
                activity: 'meetup',
                star: '1', // TODO: Would be better to type it
              })}
            >
              <Button type="primary" className="font-bold w-full">
                Play Bots
              </Button>
            </Link> */}
            <Link
              href={links.getOnDemandRoomCreationLink({
                activity: 'learn',
                instructor: true,
              })}
            >
              <Button type="primary" className="font-bold w-full">
                Play
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
            <Link
              href={links.getOnDemandRoomCreationLink({
                activity: 'ailearn',
                // instructor: true,
              })}
            >
              <Button type="primary" className="font-bold w-full">
                AI
              </Button>
            </Link>
            <Link href="/lessons">
              <Button type="primary" className="font-bold w-full">
                Lessons
              </Button>
            </Link>
            <Link href="/lesson_2">
              <Button type="primary" className="font-bold w-full">
                Lessons 600-1200
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
