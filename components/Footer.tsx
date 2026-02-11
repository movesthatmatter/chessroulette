import Link from 'next/link';

export default () => {
  return (
    <footer
      className="
      pl-[max(env(safe-area-inset-left),1.5rem)]
      pr-[max(env(safe-area-inset-right),1.5rem)]
      pt-[max(env(safe-area-inset-top),1rem)]
      pb-[1rem]
      flex justify-center text-slate-400"
    >
      <span>
      <span>
        Powered by{' '}
        <Link href="https://movex.dev" target="_blank" className='font-bold'>
          Movex
        </Link>
      </span>
      </span>
    </footer>
  );
};
