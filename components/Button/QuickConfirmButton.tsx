'use client';

import React, { useRef, useState } from 'react';
import { Button, ButtonProps } from './Button';
import { useOnClickOutside } from '@/lib/hooks';

type Props = ButtonProps & {
  confirmationMessage?: string | React.ReactNode;
  confirmationBgcolor?: ButtonProps['bgColor'];
};

export const QuickConfirmButton: React.FC<Props> = ({
  onClick,
  confirmationMessage = 'Confirm?',
  confirmationBgcolor = 'red',
  children,
  bgColor,
  ...props
}) => {
  const [show, setShow] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useOnClickOutside(buttonRef, () => {
    setShow(false);
  });

  return (
    <Button
      {...props}
      ref={buttonRef}
      bgColor={show ? confirmationBgcolor : bgColor}
      onClick={() => {
        if (!show) {
          setShow(true);
        } else {
          onClick?.();

          setShow(false);
        }
      }}
    >
      {show ? (
        <span className="font-normal">{confirmationMessage}</span>
      ) : (
        children
      )}
    </Button>
  );
};
