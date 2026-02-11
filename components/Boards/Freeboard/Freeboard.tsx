import { DistributiveOmit } from '@/lib/misc';
import {
  ChessboardContainer,
  ChessboardContainerProps,
  useBoardTheme,
} from '../../Chessboard';
import { ChessFENBoard } from '@/lib/ChessFENBoard';

export type FreeboardProps = DistributiveOmit<
  ChessboardContainerProps,
  'boardTheme'
>;

/**
 * This is a free board where there are no rules and magical moves are possible!
 *
 * @param param0
 * @returns
 */
export const Freeboard = ({
  fen = ChessFENBoard.STARTING_FEN,
  ...props
}: FreeboardProps) => (
  <ChessboardContainer fen={fen} boardTheme={useBoardTheme()} {...props} />
);
