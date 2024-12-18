'use client';

import { useState } from 'react';
import { Dialog } from '@app/components/Dialog';
import { Button, ButtonProps } from '@app/components/Button';
import { DistributiveOmit } from '@xmatter/util-kit';
import { MatchSetupWidget } from './MatchSetupWidget';

type Props = DistributiveOmit<ButtonProps, 'onClick'> & {};

export const CreateMatchButton = ({ ...buttonProps }: Props) => {
  const [show, setShow] = useState(false);

  return (
    <>
      <Button {...buttonProps} onClick={() => setShow(true)}>
        Play
      </Button>
      {show && (
        <Dialog
          title="Create Match"
          hasCloseButton
          content={<MatchSetupWidget />}
          onClose={() => setShow(false)}
        />
      )}
    </>
  );
};
