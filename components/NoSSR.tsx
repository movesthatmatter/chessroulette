import dynamic from 'next/dynamic';
import { PropsWithChildren } from 'react';

const Render = (props: PropsWithChildren) => props.children;

// TODO: Need to ensure if this is the best way to do it since it loads js at runtime and it's slower but might as well be
export const NoSSR = dynamic(() => Promise.resolve(Render), {
  ssr: false,
});
