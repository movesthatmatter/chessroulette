import { PropsWithChildren } from 'react';

type Props = PropsWithChildren<{}>;

export const Modal = ({ children }: Props) => {
  return (
    <>
      <div
        className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none"
        tabIndex={-1}
        aria-hidden="true"
      >
        <div className="relative w-auto my-6 mx-auto max-w-3xl">{children}</div>
      </div>
      <div className="opacity-30 fixed inset-0 z-40 bg-black" />
    </>
  );
};
