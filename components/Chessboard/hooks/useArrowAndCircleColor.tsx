'use client';

import useEventListener from '@use-it/event-listener';
import { keyInObject } from '@/lib/misc';
import { useState } from 'react';

type ArrowColorsInOrder = [string, string, string];

const DEFAULT_COLORS: ArrowColorsInOrder = ['#11c6d1', '#f2358d', '#6f7381'];

export const useArrowAndCircleColor = (colors = DEFAULT_COLORS) => {
  const [colorIndex, setColorIndex] = useState(0);
  const [controlKeyPressed, setControlKeyPressed] = useState(false);

  useEventListener('keydown', (event: object) => {
    if (!keyInObject(event, 'key')) {
      return;
    }

    if (event.key === 'Meta') {
      setColorIndex((prev) => prev + 1);

      // If the ControlKey is already pressed inc once more
      if (controlKeyPressed) {
        setColorIndex((prev) => prev + 1);
      }
    }

    if (event.key === 'Control') {
      setControlKeyPressed(true);

      // If the MetaKey is already change the index
      if (colorIndex === 1) {
        setColorIndex(2);
      }
    }
  });

  useEventListener('keyup', (event: object) => {
    if (!keyInObject(event, 'key')) {
      return;
    }

    if (event.key === 'Meta') {
      setColorIndex(0);
    }

    if (event.key === 'Control') {
      setControlKeyPressed(false);

      if (colorIndex === 2) {
        setColorIndex(1);
      }
    }
  });

  return colors[colorIndex];
};
