import { useEffect } from 'react';
import { SmartCountdownProps, SmartCountdown } from './SmartCountdown';

type Props = SmartCountdownProps & {
  onRefreshMsLeft?: () => void;
};

export const SmartCountdownContainer = ({
  onRefreshMsLeft,
  ...props
}: Props) => {
  useEffect(() => {
    if (!(onRefreshMsLeft && props.isActive)) {
      return;
    }

    const handler = () => {
      if (!document.hidden) {
        onRefreshMsLeft();
      }
    };

    // Note: This checks when the tab is inactive and restarts it when reactivates
    //  This is because since Chrome 57, when the tab is inactive the timer stops or doesn't
    //  run accurately!
    // See https://usefulangle.com/post/280/settimeout-setinterval-on-inactive-tab
    document.addEventListener('visibilitychange', handler);

    return () => {
      document.removeEventListener('visibilitychange', handler);
    };

    /**
     * This doesn't depend on onRefreshMsLeft to refresh on Purpose, since
     * this methof could be given on the fly and thus it would update on each render, while it isn't needed
     */
  }, [props.isActive]);

  return <SmartCountdown {...props} />;
};
