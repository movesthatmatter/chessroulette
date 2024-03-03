'use client';
import { CSSProperties, useEffect } from 'react';

import demo1 from './assets/1.jpg';
import demo2 from './assets/2.jpg';
import demo3 from './assets/3.jpg';
import demo4 from './assets/4.jpg';

import { getRandomInt } from 'apps/chessroulette-web/util';

const DemoImgs = [
  demo1,
  demo2,
  demo3,
  demo4,
  demo1,
  demo2,
  demo3,
  demo4,
  demo1,
  demo2,
];

export type Props = {
  // sizePx: number;
  style?: CSSProperties;
  className?: string;
  demoImgId?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  onReady?: () => void;
};

export const CameraView = (props: Props) => {
  const imgSrc =
    DemoImgs[
      props.demoImgId === undefined
        ? getRandomInt(0, DemoImgs.length - 1)
        : props.demoImgId
    ];

  useEffect(() => {
    props.onReady?.();
  }, []);

  return (
    <div
      className={props.className}
      style={{
        ...props.style,
        backgroundImage: `url(${imgSrc.src})`,
        backgroundSize: 'cover',
      }}
    >
      {/* <img src={imgSrc.src}/> */}
    </div>
  );
};