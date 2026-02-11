import { PieceSan } from '@/lib/ChessRouler';
import { noop } from '@/lib/misc';
import { useEffect } from 'react';
import { useDrag } from 'react-dnd';

export type DraggableItemProps = React.PropsWithChildren & {
  pieceSan: PieceSan;
  className?: string;
  onDraggingStarted?: (pieceSan: PieceSan) => void;
  onDraggingStopped?: (pieceSan: PieceSan) => void;
};

export const DraggableItem: React.FC<DraggableItemProps> = ({
  pieceSan,
  onDraggingStarted = noop,
  onDraggingStopped = noop,
  className,
  ...props
}) => {
  const [collected, drag] = useDrag(
    () => ({
      // "type" is required. It is used by the "accept" specification of drop targets.
      type: 'piece',
      item: {
        pieceSan,
      },
      // The collect function utilizes a "monitor" instance (see the Overview for what this is)
      // to pull important pieces of state from the DnD system.
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [pieceSan],
  );

  useEffect(() => {
    if (collected.isDragging) {
      onDraggingStarted(pieceSan);
    } else {
      onDraggingStopped(pieceSan);
    }
  }, [pieceSan, collected.isDragging, onDraggingStarted, onDraggingStopped]);

  return (
    <div
      role="Handle"
      ref={(...arg) => {
        drag(...arg);
      }}
      className={className}
    >
      {props.children}
    </div>
  );
};
