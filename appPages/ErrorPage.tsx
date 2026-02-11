type Props = {
  error?: Error & { digest?: string };
  extra?: any;
};

export const ErrorPage = ({ error, extra }: Props) => {
  console.error('ErrorPage Error', error);

  return (
    <div className="flex flex-1 items-center justify-center h-screen w-screen text-sm divide-x">
      <div className="flex flex-col gap-4 items-center">
        <h2 className="text-2xl">Something went wrong in App Page!</h2>
        <pre>Error: {JSON.stringify(error || { no: 'error' }, null, 2)}</pre>
        {extra && <pre>Exra: {JSON.stringify(extra, null, 2)}</pre>}
      </div>
    </div>
  );
};
