import React, { CSSProperties } from 'react';

export type TextProps = (JSX.IntrinsicElements['span'] &
  JSX.IntrinsicElements['p']) & {
  size?:
    | 'small1'
    | 'small2'
    | 'small3'
    | 'smallItalic'
    | 'body1'
    | 'body2'
    | 'subtitle1'
    | 'subtitle2'
    | 'title1'
    | 'title2'
    | 'titleItalic'
    | 'largeNormal'
    | 'largeBold'
    | 'tiny1'
    | 'tiny2';
  style?: CSSProperties;
  className?: string;
  asParagraph?: boolean;
  asLink?: boolean;
};

export const Text: React.FC<TextProps> = ({
  size = 'body1',
  className,
  asParagraph,
  asLink,
  ...props
}) => {
  if (asParagraph) {
    return (
      <p {...props} className={className}>
        {props.children}
      </p>
    );
  }

  return (
    <span {...props} className={className}>
      {props.children}
    </span>
  );
};
