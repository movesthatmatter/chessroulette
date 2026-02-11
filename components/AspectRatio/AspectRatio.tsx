import React, { CSSProperties, useMemo } from 'react';

export type AspectRatioExplicit = {
  width: number;
  height: number;
};

export type AspectRatioProps = React.HTMLProps<HTMLDivElement> & {
  aspectRatio?: AspectRatioExplicit | number;
} & (
    | {
        width?: number | string;
        height?: never;
      }
    | {
        height?: number;
        width?: never;
      }
  ) & {
    contentClassname?: string;
  };

export const AspectRatio: React.FC<AspectRatioProps> = React.memo(
  ({
    aspectRatio = {
      width: 16,
      height: 9,
    },
    ...props
  }) => {
    const aspectStyle = useMemo<CSSProperties>(() => {
      const ratio =
        typeof aspectRatio === 'number'
          ? aspectRatio
          : aspectRatio.width / aspectRatio.height;

      return {
        paddingBottom: `${100 / ratio}%`,
      };
    }, [aspectRatio]);

    return (
      <div style={props.style} className={props.className}>
        <div className="w-full relative" style={aspectStyle}>
          <div className="absolute w-full h-full top-0 left-0 bottom-0 right-0">
            {props.children}
          </div>
        </div>
      </div>
    );
  }
);
