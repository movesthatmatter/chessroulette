'use client';

import { useSearchParams } from 'next/navigation';
import { defaultTheme, themes } from './defaultTheme';
import { isOneOf } from '@/lib/misc';
import { objectKeys } from 'movex-core-util';

export const useTheme = () => {
  // TODO: This is just temporary as the user ids are passed in the url
  const params = useSearchParams();

  // const foundNeededTheme =
  const themeParam = params.get('theme') || '';

  const baseTheme = {
    ...defaultTheme,
    ...(isOneOf(themeParam, objectKeys(themes)) && themes[themeParam]),
  };

  const darkSquare = params.get('darkSquare') || undefined;
  const lightSquare = params.get('lightSquare') || undefined;
  const hoveredSquare = params.get('hoveredSquare') || undefined;

  const kidsMode = themeParam.indexOf('kids') > -1;

  // TODO: Validate colors

  return {
    ...baseTheme,
    kidsMode,
    board: {
      ...baseTheme.board,
      ...(darkSquare && { darkSquare }),
      ...(lightSquare && { lightSquare }),
      ...(hoveredSquare && { hoveredSquare }),
      kidsMode,
    },
  };
};
