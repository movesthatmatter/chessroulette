import React, { CSSProperties } from 'react';
import { PieceSan } from '@/lib/ChessRouler';
import { toImgPath } from '@/lib/misc';

type Props = {
  pieceSan: PieceSan;
  squareSize: number;
  registry: Record<PieceSan, any>;
  className?: string;
  style?: CSSProperties;
};

export const Piece: React.FC<Props> = React.memo(
  ({ pieceSan, registry, squareSize: width, className, style }) => (
    <img
      src={toImgPath(registry[pieceSan])}
      style={{ width, maxWidth: width, ...style }}
      className={className}
    />
  )
);
