import { DistributiveOmit } from '@/lib/misc';
import {
  ChessboardContainer,
  ChessboardContainerProps,
  CirclesMap,
  useBoardTheme,
} from '../../Chessboard';
import { useCallback, useState } from 'react';
import { validateMove } from './util';
import { ChessColor, ShortChessMove } from '@/lib/ChessRouler';
import { ChessFENBoard } from '@/lib/ChessFENBoard';

export type PlayboardProps = DistributiveOmit<
  ChessboardContainerProps,
  'boardTheme' | 'onMove' | 'strict' | 'turn'
> & {
  playingColor: ChessColor;
  turn: ChessColor;
  onMove: (m: ShortChessMove) => void;
  canPlay?: boolean;
  overlayComponent?: React.ReactNode;
};

/**
 * This board validates the moves based on the Chess rules
 *
 * @param param0
 * @returns
 */
export const Playboard = ({
  fen = ChessFENBoard.STARTING_FEN,
  playingColor,
  boardOrientation = playingColor,
  onMove,
  canPlay = false,
  turn,
  ...props
}: PlayboardProps) => {
  const boardTheme = useBoardTheme();
  const [circlesMap, setCirclesMap] = useState<CirclesMap>({});

  const onValidateMove = useCallback(
    (move: ShortChessMove) => {
      if (!canPlay) {
        return false;
      }

      if (turn !== playingColor) {
        return false;
      }

      return validateMove(move, fen, playingColor).valid;
    },
    [canPlay, turn, fen, playingColor],
  );

  return (
    <ChessboardContainer
      strict
      turn={turn}
      fen={fen}
      boardOrientation={boardOrientation}
      boardTheme={boardTheme}
      onValidateMove={onValidateMove}
      onMove={onMove}
      circlesMap={circlesMap}
      onCircleDraw={(c) => {
        setCirclesMap((prev) => ({
          ...prev,
          [c[0]]: c,
        }));
      }}
      onClearCircles={() => {
        setCirclesMap({});
      }}
      {...props}
    />
  );
};
