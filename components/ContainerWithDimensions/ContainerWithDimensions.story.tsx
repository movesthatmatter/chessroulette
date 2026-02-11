/* eslint-disable import/no-extraneous-dependencies */
import React from 'react';
import { ContainerWithDimensions } from './ContainerWithDimensions';

export default {
  component: ContainerWithDimensions,
  title: 'Components/ContainerWithDimensions',
};

export const defaultStory = () => (
  <ContainerWithDimensions
    style={{ height: 30 }}
    render={(dimensions) => (
      <>
        <p>{`width: ${dimensions.width}`}</p>
        <p>{`height: ${dimensions.height}`}</p>
      </>
    )}
  />
);
