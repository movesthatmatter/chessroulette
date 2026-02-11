'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AsyncResult } from 'ts-async-results';
import {
  BgColor,
  ButtonProps,
  buttonIconClasses,
  getButtonColors,
  toStringColors,
} from './Button';
import { IconProps, Icon } from '../Icon/Icon';
import { Text } from '../Text';
import { useOnClickOutside } from '@/lib/hooks';

export type ActionButtonProps = {
  type: ButtonProps['type'];
  size?: 'xs' | 'sm' | 'md' | 'lg';
  label: string;
  actionType: 'positive' | 'negative' | 'attention';
  confirmation?: string;
  onSubmit: (() => void) | (() => Promise<any>) | (() => AsyncResult<any, any>);
  withLoader?: boolean;
  disabled?: boolean;
  onFirstClick?: () => void;
  icon?: IconProps['name'];
  iconKind?: IconProps['kind'];
  hideLabelUntilHover: Boolean;
  color?: BgColor;
};

export const ActionButton: React.FC<ActionButtonProps> = ({
  hideLabelUntilHover = true,
  withLoader,
  onFirstClick,
  icon,
  iconKind,
  size = 'md',
  ...props
}) => {
  const wrapperRef = useRef(null);
  const [hovered, setHovered] = useState(!hideLabelUntilHover);
  const [focused, setFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const onClickedOutsideCB = useCallback(() => {
    if (isLoading) {
      return;
    }

    if (focused) {
      setFocused(false);
    }
  }, [focused, isLoading]);

  useOnClickOutside(wrapperRef, onClickedOutsideCB);

  useEffect(() => {
    if (props.disabled) {
      setFocused(false);
      setHovered(false);
      setIsLoading(false);
    }
  }, [props.disabled]);

  const submit = () => {
    const result = props.onSubmit();

    if (!withLoader) {
      setHovered(!hideLabelUntilHover);
    }

    setFocused(true);

    if (AsyncResult.isAsyncResult(result)) {
      setIsLoading(true);

      result
        .map(() => {
          setIsLoading(false);
          setFocused(false);
          setHovered(!hideLabelUntilHover);
        })
        .mapErr(() => {
          setIsLoading(false);
          setFocused(false);
          setHovered(!hideLabelUntilHover);
        });
    } else {
      setIsLoading(true);

      Promise.resolve(result).finally(() => {
        setIsLoading(false);
        setFocused(false);
        setHovered(!hideLabelUntilHover);
      });
    }
  };

  return (
    <button
      ref={wrapperRef}
      className={`flex justify-end items-center content-center flex-row gap-3 rounded-xl ${
        props.disabled
          ? 'bg-gray-200'
          : toStringColors(getButtonColors(props.color || 'indigo'))
      }`}
      disabled={props.disabled}
      type="submit"
      onMouseEnter={() => {
        if (!props.disabled) {
          setHovered(true);
        }
      }}
      onMouseLeave={() => {
        setFocused(false);
        setHovered(!hideLabelUntilHover);
      }}
      onClick={() => {
        if (isLoading || props.disabled) {
          return;
        }

        setFocused((prev) => {
          if (prev) {
            submit();
          } else {
            if (onFirstClick) {
              onFirstClick();
            }
          }

          return !prev;
        });
      }}
    >
      <div className="aspect-square rounded-xl p-1">
        {icon && (
          <Icon
            kind={iconKind}
            name={icon}
            className={buttonIconClasses[size]}
            color="white"
          />
        )}
      </div>
      {(hovered || focused) && (
        <div className="relative pl-1 pr-1">
          <Text
            className="text-white"
            style={{
              ...(isLoading && {
                visibility: 'hidden',
              }),
            }}
          >
            {focused ? `Confirm?` : props.label}
          </Text>
          {isLoading && (
            <div className="absolute top-0 bottom-0-0 right-0 left-0">
              {/*<Loader type="ball-pulse" active innerClassName={cls.loader} />*/}
            </div>
          )}
        </div>
      )}
    </button>
  );
};
