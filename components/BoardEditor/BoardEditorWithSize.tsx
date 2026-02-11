import { min } from '@/lib/misc';
import { ContainerWithDimensions } from '../ContainerWithDimensions';
import { BoardEditor, BoardEditorProps } from './BoardEditor';

type Props = Omit<BoardEditorProps, 'sizePx'> & {
  sizePx?: number;
};

export const BoardEditorWithSize = ({ sizePx, ...props }: Props) => {
  if (sizePx) {
    return <BoardEditor sizePx={sizePx} {...props} />;
  }

  return (
    <ContainerWithDimensions
      className="w-full h-full"
      render={(d) => <BoardEditor {...props} sizePx={min(d.height, d.width)} />}
    />
  );
};
