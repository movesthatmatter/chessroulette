import { useState } from 'react';
import { useKeyboardEventListener } from '../hooks';

export type VariantMenuProps = {
  items: {
    value: string;
    onSelect: () => void;
  }[];
};

export const VariantMenuContainer = ({ items }: VariantMenuProps) => {
  const [show, setShow] = useState(false);
  const [itemIndex, setItemIndex] = useState(0);

  useKeyboardEventListener((k, event) => {
    if (k === 'ArrowRight') {
      setShow(true);
    }

    if (show) {
      event.preventDefault();
      if (k === 'ArrowDown' && itemIndex < items.length - 1) {
        setItemIndex((prev) => prev + 1);
      } else if (k === 'ArrowUp' && itemIndex > 0) {
        setItemIndex((prev) => prev - 1);
      } else if (k === 'Enter' || k === 'ArrowRight') {
        items[itemIndex].onSelect();
      } else if (k === 'Escape') {
        setShow(false);
      }
    }
  });

  if (!show) {
    return null;
  }

  return (
    <div
      className="
      bg-slate-200 text-black hover:cursor-pointer
      flex flex-col font-normal rounded-md overflow-hidden
      absolute top-0 right-0 z-50"
    >
      {items.map((v, i) => (
        <div
          key={v.value + i}
          className={`hover:bg-slate-300 px-2 p-1 ${
            i === itemIndex ? 'bg-slate-400' : ''
          }`}
          onClick={v.onSelect}
        >
          {v.value}
        </div>
      ))}
    </div>
  );
};
