import React, { useEffect, useState } from 'react';
import debounce from 'debounce';

export type ContainerDimensions = {
  width: number;
  height: number;
  updated: boolean;
};

export function useContainerDimensions(
  targetRef: React.RefObject<HTMLElement>
) {
  const [dimensions, setDimensions] = useState<ContainerDimensions>({
    width: 0,
    height: 0,
    updated: false,
  });

  useEffect(() => {
    const onResizeHandler = () => {
      setDimensions((prev) => {
        if (!targetRef.current) {
          return prev;
        }

        const next = {
          width: targetRef.current.offsetWidth,
          height: targetRef.current.offsetHeight,
          updated: true,
        };

        // If nothing changed return prev!
        if (
          prev.height === next.height &&
          prev.width === next.width &&
          next.updated === true
        ) {
          return prev;
        }

        return next;
      });
    };

    onResizeHandler();

    window.addEventListener('resize', debounce(onResizeHandler, 250));

    return () => {
      window.removeEventListener('resize', onResizeHandler);
    };
  }, [targetRef.current]);

  return dimensions;
}

export type Rect = Omit<DOMRect, 'toJSON'> & { updated: boolean };

const DEFAULT_RECT: Rect = {
  width: 0,
  height: 0,
  x: 0,
  y: 0,
  bottom: 0,
  left: 0,
  right: 0,
  top: 0,
  updated: false,
};

export function useContainerRect(targetRef: React.RefObject<HTMLElement>) {
  const [state, setState] = useState(DEFAULT_RECT);

  useEffect(() => {
    const update = () => {
      setState((prev) => {
        if (!targetRef.current) {
          return prev;
        }

        const rect = targetRef.current.getBoundingClientRect();

        return {
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
          top: rect.top,
          left: rect.left,
          right: rect.right,
          x: rect.x,
          y: rect.y,
          updated: true,
        };
      });
    };

    update();

    window.addEventListener('resize', debounce(update, 250));

    return () => {
      window.removeEventListener('resize', update);
    };
  }, [targetRef.current]);

  return state;
}
