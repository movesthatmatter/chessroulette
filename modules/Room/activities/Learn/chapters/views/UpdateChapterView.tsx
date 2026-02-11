import { useMemo, useRef } from 'react';
import {
  EditChapterStateView,
  EditChapterStateViewProps,
} from './EditChapterStateView';
import { areChapterStatesEqual } from '../util';

export type UpdateChapterItemProps = {
  renderSubmit: (p: { hasInputChanged: boolean }) => React.ReactNode;
  className?: string;
} & EditChapterStateViewProps;

export const UpdateChapterView = ({
  renderSubmit,
  className,
  ...editChapterStateViewProps
}: UpdateChapterItemProps) => {
  const initialStateRef = useRef(editChapterStateViewProps.state);

  const hasInputChanged = useMemo(() => {
    return !areChapterStatesEqual(
      editChapterStateViewProps.state,
      initialStateRef.current
    );
  }, [editChapterStateViewProps.state]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-3 overflow-scroll">
        <EditChapterStateView {...editChapterStateViewProps} />
      </div>
      {renderSubmit({ hasInputChanged })}
    </div>
  );
};
