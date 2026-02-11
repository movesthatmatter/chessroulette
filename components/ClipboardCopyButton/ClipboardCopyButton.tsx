'use client';

import React, { useState } from 'react';
import { noop } from '@/lib/misc';
import { Button, ButtonProps, IconButton } from '../Button';

type BaseProps = Omit<ButtonProps, 'onClick'> & {
  value: string;
  onCopied?: () => void;
};

type Props =
  | (BaseProps & {
      buttonComponentType?: 'Button';
      render: (copied: boolean) => React.ReactNode;
      onCopiedIcon?: undefined;
    })
  | (BaseProps & {
      buttonComponentType: 'IconButton';
      icon: NonNullable<BaseProps['icon']>;
      onCopiedIcon?: BaseProps['icon'];
      render?: undefined;
    });

export const ClipboardCopyButton: React.FC<Props> = ({
  value,
  onCopied = noop,
  buttonComponentType = 'Button',
  icon,
  onCopiedIcon = icon,
  render,
  ...buttonProps
}) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2 * 1000);

      onCopied();
    } catch (e) {}
  };

  if (buttonComponentType === 'IconButton') {
    return (
      <IconButton
        onClick={copy}
        icon={copied ? onCopiedIcon! : icon!}
        {...buttonProps}
      />
    );
  }

  return (
    <Button onClick={copy} {...buttonProps}>
      {render?.(copied)}
    </Button>
  );
};
