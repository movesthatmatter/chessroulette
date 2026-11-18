import React from 'react';
import { Button, ButtonProps } from '../Button';
import { Icon } from '../Icon/Icon';

type Props = {
  title: React.ReactNode;
  content: string | React.ReactNode;
  buttons?: ButtonProps[];
  onClose?: () => void;
  hasCloseButton?: boolean;
  modalBG?: 'dark' | 'light';
  // X ne zauzima svoj red i naslov je manji - za dijaloge kojima treba prostor
  compactHeader?: boolean;
  // jace zatamnjenje pozadine (75% umesto 50%)
  dim?: 'normal' | 'strong';
};

export const Dialog: React.FC<Props> = ({
  modalBG = 'dark',
  dim = 'normal',
  ...props
}) => {
  return (
    <div
      className={`fixed inset-0 z-[101] flex justify-center content-center items-center px-2 md:px-12 ${
        dim === 'strong' ? 'bg-opacity-75' : 'bg-opacity-50'
      } ${modalBG === 'dark' ? 'bg-black' : 'bg-white'}`}
    >
      <div
        className={`animate-dialogIn flex bg-black-light rounded-xl md:px-8 px-2 shadow-2xl shadow-black w-full max-w-[330px] max-h-[calc(100dvh-1rem)] overflow-y-auto scrollbar-hide ${
          props.hasCloseButton ? 'md:max-w-[480px]' : 'md:max-w-[420px]'
        } ${props.compactHeader ? 'relative pt-6 pb-4' : 'py-4'}`}
        style={{ boxShadow: '0px 0px 40px 0px #07DA6355' }}
      >
        <div className="flex flex-col gap-4 w-full">
          {props.hasCloseButton && (
            <div
              className={
                props.compactHeader
                  ? 'absolute top-7 right-4 z-10'
                  : 'flex flex-row justify-end w-full '
              }
            >
              <div
                onClick={() => props.onClose && props.onClose()}
                className="flex group hover:cursor-pointer"
              >
                <Icon
                  name="XCircleIcon"
                  className="w-4 h-4 group-hover:text-red-400"
                />
              </div>
            </div>
          )}
          <div className="p-2 gap-4 flex flex-col w-full pt-0">
            {props.title && (
              <>
                <div
                  className={`flex justify-center capitalize text-center font-semibold tracking-wide ${
                    props.compactHeader ? 'text-base px-6' : 'text-lg'
                  }`}
                >
                  {props.title}
                </div>
                <div className="w-full h-px bg-white/10" />
              </>
            )}
            <div className="flex flex-col gap-2">{props.content}</div>
            {props.buttons && (
              <div className="flex flex-row justify-center gap-3">
                {props.buttons.map((buttonProps, i) =>
                  buttonProps ? <Button key={i} {...buttonProps} /> : null
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
