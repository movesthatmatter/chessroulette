import React, { PropsWithChildren } from 'react';
import { invoke, isOneOf } from '@/lib/misc';
import { Icon, IconProps } from '../Icon/Icon';

type Direction = 'left' | 'right' | 'top' | 'bottom';
const swapDirection = (d: Direction): Direction => {
  if (isOneOf(d, ['left', 'right'])) {
    return d === 'left' ? 'right' : 'left';
  }

  return d === 'bottom' ? 'top' : 'bottom';
};

type NativeButtonProps = React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>;

export type ButtonProps = Omit<NativeButtonProps, 'type' | 'ref'> &
  PropsWithChildren<{
    type?: 'primary' | 'secondary' | 'clear' | 'custom';
    onClick?: () => void;
    className?: string;
    disabled?: boolean;
    isActive?: boolean;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    icon?: IconProps['name'];
    iconKind?: IconProps['kind'];
    bgColor?: BgColor;
    tooltip?: string;
    tooltipPositon?: 'left' | 'top' | 'right' | 'bottom';
    buttonType?: NativeButtonProps['type'];
  }>;

export type BgColor =
  | 'purple'
  | 'green'
  | 'blue'
  | 'indigo'
  | 'yellow'
  | 'orange'
  | 'slate'
  | 'gray'
  | 'red'; // Add more colors

export const getButtonColors = (
  color: BgColor,
  cssProp: 'bg' | 'text' = 'bg'
) => ({
  initial: `${cssProp}-${color}-500`,
  hover: `${cssProp}-${color}-600`,
  active: `${cssProp}-${color}-800`,
});

export const toStringColors = (p: {
  initial: string;
  hover: string;
  active: string;
}) => `${p.initial} hover:${p.hover} active:${p.active}`;

const classes = {
  md: 'p-2 px-4 rounded-xl',
  lg: '',
  sm: 'p-1 px-2 text-sm rounded-lg',
  xs: 'p-1 px-2 text-xs rounded-md',
  primary: `text-white font-bold ${toStringColors(getButtonColors('indigo'))}`,
  clear: `text-gray-300 font-bold hover:text-white`,
  secondary: `${toStringColors(getButtonColors('slate'))}`,
  custom: '',
};

const typeToColors: {
  [k in NonNullable<Exclude<ButtonProps['type'], 'custom'>>]: BgColor;
} = {
  primary: 'indigo',
  secondary: 'slate',
  clear: 'slate',
};

export const buttonIconClasses = {
  lg: 'h-6 w-6',
  md: 'h-5 w-5',
  sm: 'h-4 w-4',
  xs: 'h-3 w-3',
};

/**
 * Note: By default doesn't submit forms, unless "submit" buttonType is specified
 */
export const Button = React.forwardRef<HTMLButtonElement | null, ButtonProps>(
  (
    {
      children,
      type = 'primary',
      disabled,
      isActive,
      onClick,
      className,
      size = 'md',
      icon,
      iconKind,
      bgColor,
      tooltip,
      tooltipPositon = 'left',
      buttonType = 'button', // This by default doesn't submit forms, unless "submit" type is specified
      ...props
    },
    ref
  ) => {
    const isActiveClass = invoke(() => {
      if (isActive && type !== 'custom') {
        const bgColorClass = getButtonColors(
          bgColor || typeToColors[type]
        ).active;
        return `${bgColorClass} hover:${bgColorClass}`;
      }

      return '';
    });

    return (
      <button
        ref={ref}
        className={`group relative hover:cursor-pointer ${classes[type]} ${
          classes[size]
        } ${
          disabled
            ? 'bg-slate-400 hover:bg-slate-400 active:bg-slate-400 hover:cursor-default'
            : ''
        } flex items-center justify-center gap-1 ${className} ${
          bgColor ? toStringColors(getButtonColors(bgColor)) : ''
        } ${isActiveClass}`}
        onClick={onClick}
        disabled={disabled === true}
        type={buttonType}
        {...props}
      >
        {icon && (
          <Icon
            kind={iconKind}
            name={icon}
            className={buttonIconClasses[size]}
          />
        )}

        {children}

        {tooltip && (
          <div
            className="hidden group-hover:block absolute"
            style={{
              transition: 'all 50ms linear',
              top: '0%',
              [swapDirection(tooltipPositon)]: '120%',
              zIndex: 999,
            }}
          >
            <div
              className="bg-white text-nowrap text-xs border rounded-lg p-1 text-black font-normal"
              style={{ boxShadow: '0 6px 13px rgba(0, 0, 0, .1)' }}
            >
              {tooltip}
            </div>
          </div>
        )}
      </button>
    );
  }
);
