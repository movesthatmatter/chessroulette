/* eslint-disable import/no-extraneous-dependencies */
import React from 'react';
import { TextArea } from './TextArea';

export default {
  component: TextArea,
  title: 'components/TextArea',
};

export const defaultStory = () => (
  <div
    style={{
      width: '300px',
    }}
  >
    <TextArea rows={5} />
  </div>
);

export const withValue = () => (
  <div
    style={{
      width: '300px',
    }}
  >
    <TextArea rows={7} label="With Value" value="A bad value" />
  </div>
);

export const withLabel = () => (
  <div
    style={{
      width: '300px',
    }}
  >
    <TextArea label="My Label" />
  </div>
);

export const withPlaceholder = () => (
  <div
    style={{
      width: '300px',
    }}
  >
    <TextArea placeholder="My Placeholder" />
  </div>
);

export const asReadonly = () => (
  <div
    style={{
      width: '300px',
    }}
  >
    <TextArea label="My Label" value="My Readonly Value" readOnly />
  </div>
);

export const withValidationError = () => (
  <div
    style={{
      width: '300px',
    }}
  >
    <TextArea
      label="With Error"
      value="A bad value"
      validationError="The value you enetered isn't valid"
    />
  </div>
);
