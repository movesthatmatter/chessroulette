import { CheckIcon, DocumentDuplicateIcon } from '@heroicons/react/16/solid';
import { ChessFEN } from '@/lib/ChessRouler';
import { ClipboardCopyButton } from '@/components/ClipboardCopyButton';

type Props = {
  fen: ChessFEN;
  className?: string;
};

export const FenPreview = ({ fen, className }: Props) => {
  return (
    <div
      className={`flex items-space-between p-1 pl-3 border border-slate-400 rounded-lg ${className}`}
    >
      <p className="flex-1 overflow-x-scroll text-wrap break-all text-slate-400">
        FEN: {fen}
      </p>
      <ClipboardCopyButton
        value={fen}
        type="custom"
        size="sm"
        render={(copied) =>
          copied ? (
            <CheckIcon className="w-5 h-5 text-slate-400 text-green-500" />
          ) : (
            <DocumentDuplicateIcon className="w-5 h-5 text-slate-400 hover:text-slate-200" />
          )
        }
      />
    </div>
  );
};
