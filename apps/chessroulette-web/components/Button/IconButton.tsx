import React from 'react';
import { Ensure } from '@xmatter/util-kit';
import { Icon, IconProps } from '../Icon';
import { Button, ButtonProps, buttonIconClasses } from './Button';

export type IconButtonProps = Ensure<Omit<ButtonProps, 'children'>, 'icon'> & {
  iconColor?: IconProps['color'];
  iconClassName?: string;
};

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  iconKind,
  iconColor,
  iconClassName = '',
  size = 'md',
  ...props
}) => {
  return (
    <Button {...props} size={size}>
      <Icon
        name={icon}
        kind={iconKind}
        className={`${buttonIconClasses[size]} ${iconClassName}`}
        color={iconColor}
      />
    </Button>
  );
};
