import React from 'react';
import { Text } from '../Text';

type Props = React.DetailedHTMLProps<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  HTMLTextAreaElement
> & {
  className?: string;
  containerClassName?: string;
  label?: string;
  validationError?: string;
  hasValidationError?: boolean;
};

export const TextArea: React.FC<Props> = ({
  className = '',
  containerClassName = '',
  label,
  value,
  hasValidationError,
  validationError,
  ...props
}) => {
  return (
    <div className={`flex flex-col ${containerClassName}`}>
      {label && <Text size="small2">{label}</Text>}
      <textarea
        value={value}
        className="flex-1 border-none bg-transparent w-full focus:outline-none"
        {...props}
      />
    </div>
  );
};
