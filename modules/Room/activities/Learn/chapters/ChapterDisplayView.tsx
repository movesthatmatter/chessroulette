import { useMemo } from 'react';
import { toLongChessColor } from '@/lib/ChessRouler';
import { ChapterState } from '../movex';
import { ChessFENBoard } from '@/lib/ChessFENBoard';

type Props = {
  chapter: ChapterState;
  className?: string;
};

export const ChapterDisplayView = ({ chapter, className }: Props) => {
  const turn = useMemo(
    () =>
      toLongChessColor(
        new ChessFENBoard(chapter.displayFen).getFenState().turn,
      ),
    [chapter.displayFen],
  );

  return (
    <div className={`flex gap-2 ${className}`}>
      <span className="font-bold">{chapter.name}</span>
      <span className="capitalize">{turn} to move</span>
    </div>
  );
};
