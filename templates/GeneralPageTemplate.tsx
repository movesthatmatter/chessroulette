import Header from '../components/Header/Header';
import { CustomSession } from '../services/Auth';

type Props = React.PropsWithChildren & {
  session?: CustomSession;
  themeName?: string;
  contentClassname?: string;
};

export const GeneralPageTemplate = (props: Props) => (
  <div className="flex flex-col flex-1 w-full min-h-full">
    <Header
      themeName={props.themeName}
      showOnboarding
      session={props.session}
    />
    <div
      className={`
           ml-[max(env(safe-area-inset-left),1.5rem)]
           mr-[max(env(safe-area-inset-right),1.5rem)]
           mb-[max(env(safe-area-inset-right),2rem)]
           mt-2
           flex-1 relative overflow-hidden ${props.contentClassname}`}
    >
      {props.children}
    </div>
  </div>
);
