import { IconButton } from '@/components/Button';
import { QuickConfirmButton } from '@/components/Button/QuickConfirmButton';
import { Icon } from '@/components/Icon/Icon';
import { Chapter } from '../movex';

export type Props = {
  chapter: Chapter;
  isActive?: boolean;
  onLoadClick: () => void;
  onEditClick: () => void;
  onDeleteClick: () => void;
  className?: string;
};

export const ChapterItem = ({
  chapter,
  isActive,
  onLoadClick,
  onEditClick,
  onDeleteClick,
  className,
}: Props) => {
  // const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      key={chapter.id}
      className={`flex flex-1 gap-2 hover:cursor-pointer hover:bg-slate-600 p-2 py-3 rounded-xl border-b slast:border-0 border-slate-600 ${
        isActive ? 'bg-slate-600 ' : ''
      } ${className}`}
      title={`Load "${chapter.name}"`}
      onClick={onLoadClick}
    >
      <span className="text-sm flex-1 flex items-center group relative">
        {chapter.name}

        {/* <div
          className="hidden absolute bg-red w-32 h-32 z-50 shadow-2xl"
          style={{
            display: isHovered ? 'block' : 'none',
            // left: '-100%',
            right: 0,
            top: 0,
          }}
        >
          <PreviewChessboardContainer fen={chapter.displayFen} />
        </div> */}
      </span>

      <div className="flex gap-2">
        <IconButton
          size="sm"
          type="secondary"
          icon="PencilIcon"
          onClick={onEditClick}
          tooltip="Edit Chapter"
          tooltipPositon="bottom"
        />
        <QuickConfirmButton
          size="sm"
          confirmationMessage="Confirm Delete"
          onClick={onDeleteClick}
          // type="secondary"
          tooltip="Delete Chapter"
          tooltipPositon='bottom'
        >
          <Icon name="TrashIcon" className="w-4 h-4" />
        </QuickConfirmButton>
      </div>
    </div>
  );
};
