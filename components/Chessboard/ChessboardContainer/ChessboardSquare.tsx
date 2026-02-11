import React from 'react';
import { CustomSquareProps } from 'react-chessboard/dist/chessboard/types';

type Props = CustomSquareProps;

export const ChessboardSquare = React.forwardRef<
  HTMLDivElement,
  CustomSquareProps
>(
  (
    { square, squareColor, style: allStyles, children, ...props }: Props,
    ref
  ) => {
    const {
      ['> .circleDiv']: circleStyle,
      ['> .inCheckDiv']: inCheckStyle,
      ...style
    } = allStyles;

    return (
      <div style={style} {...props} ref={ref}>
        {inCheckStyle && typeof inCheckStyle === 'object' && (
          <div style={inCheckStyle} />
        )}
        {circleStyle && typeof circleStyle === 'object' && (
          <div style={circleStyle} />
        )}
        {children}
      </div>
    );
  }
);
