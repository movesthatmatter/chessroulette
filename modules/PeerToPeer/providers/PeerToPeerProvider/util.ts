const namespace = 'ch';
export const wNamespace = (s: string) => `${namespace}${s}`;
export const woNamespace = (s: string) =>
  s.indexOf(namespace) > -1 ? s.slice(namespace.length) : s;
