'use client';

import { useEffect } from 'react';

/**
 * Hook that alerts clicks outside of the passed ref
 */
export const useOnClickOutside = (
  ref: React.RefObject<any>,
  cb: () => void
) => {
  useEffect(() => {
    /**
     * Alert if clicked on outside of element
     */
    function handleClickOutside(event: DocumentEventMap['mousedown']) {
      if (ref.current && !ref.current.contains(event.target)) {
        cb();
      }
    }

    // Bind the event listener
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, cb]);
};
