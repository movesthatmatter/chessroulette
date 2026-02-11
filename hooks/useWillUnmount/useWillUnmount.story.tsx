/* eslint-disable import/no-extraneous-dependencies */
import React, { useState } from 'react';
import { useWillUnmount } from './useWillUnmount';
import { Button } from '@/components/Button';

const Component: React.FC = () => {
  const [color, setColor] = useState<string>('');
  useWillUnmount(() => {
    console.log('What is the color at umount:', color ? color : 'NOT SET');
  }, [color]);

  return (
    <>
      <Button onClick={() => setColor('red')}>Set Color to Red</Button>
      <Button onClick={() => setColor('yellow')}>Set Color to Yellow</Button>
      <code>Color: {color}</code>
    </>
  );
};

export default {
  component: Component,
  title: 'hooks/useWillUnmount',
};

export const withDeps = () =>
  React.createElement(() => {
    const [show, setShow] = useState(false);

    return (
      <>
        <Button onClick={() => setShow(!show)} />
        <Button>{show ? 'Hide' : 'Show'}</Button>
        {show && <Component />}
      </>
    );
  });
