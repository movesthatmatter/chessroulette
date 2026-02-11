import { DistributiveOmit } from '@/lib/misc';
import { Freeboard, FreeboardProps } from './Freeboard';
import { useState } from 'react';
import { ChessFEN } from '@/lib/ChessRouler';
import { ChessFENBoard } from '@/lib/ChessFENBoard';

type Props = DistributiveOmit<FreeboardProps, 'onMove' | 'fen'> & {
  onMove?: FreeboardProps['onMove'];
  fen?: FreeboardProps['fen'];
};

export const FreeboardContainer = ({
  turn,
  onMove,
  fen: givenFen,
  boardOrientation = 'w', // Always
  ...props
}: Props) => {
  const [fen, setFen] = useState<ChessFEN>(
    givenFen || ChessFENBoard.STARTING_FEN
  );

  return (
    <Freeboard
      turn={turn || boardOrientation}
      fen={fen}
      onMove={
        onMove ||
        ((m) => {
          const board = new ChessFENBoard(fen);

          board.move(m);

          setFen(board.fen);

          return true;
        })
      }
      {...props}
    />
  );
};
