import React, { CSSProperties } from 'react';
import logoLightFull from './assets/Logo_light_full.svg';
import ChessrouletteOutpostWhite from './assets/chessroulette+outpost.svg';
import Image from 'next/image';

type Props = {
  asLink?: boolean;
  darkBG?: boolean;
  withBeta?: boolean;
  withOutline?: boolean;
  mini?: boolean;
  className?: string;
  imgClassName?: string;
  width?: string;
  style?: CSSProperties;
  themeName?: string;
};

export const Logo: React.FC<Props> = ({ themeName, style }) => {
  const imageProps = (() => {
    if (themeName === 'op' || themeName === 'outpost') {
      return {
        src: ChessrouletteOutpostWhite,
        width: 190,
        title: 'Chessroulette + Outpost = ♥️',
      };
    }

    return {
      src: logoLightFull,
      width: 220,
      title: 'Chessroulette',
    };
  })();

  return (
    <div className="" style={style}>
      <Image {...imageProps} alt={imageProps.title} />
    </div>
  );
};
