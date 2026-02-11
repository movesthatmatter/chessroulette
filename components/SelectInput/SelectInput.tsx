import React from 'react';
import Dropdown from 'react-dropdown';
import 'react-dropdown/style.css';

type Props = {
  className?: string;
  onSelect: (val: string) => void;
  validationErrors?: boolean;
  options: string[];
  value: string;
};

export const SelectInput: React.FC<Props> = (props) => {
  return (
    <div className="">
      <Dropdown
        {...props}
        options={props.options}
        onChange={({ value }) => props.onSelect(value)}
        className="rounded-xl"
      />
    </div>
  );
};
