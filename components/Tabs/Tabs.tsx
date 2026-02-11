import React, { useEffect, useImperativeHandle, useState } from 'react';

export type TabsNav = {
  stackPush: () => void;
  stackBack: () => void;
  stackPop: () => void;
  stackTo: (i: number) => void;
  stackIndex: number;
};

type Tab = {
  id: string;
  renderHeader: (p: {
    focus: () => void;
    isFocused: boolean;
    tabId: Tab['id'];
    tabIndex: number;
  }) => React.ReactNode;
  renderContent:
    | ((p: {
        focus: (tabIndex: number, tabStackIndex?: number) => void;
        isFocused: boolean;
        nav: TabsNav;
        tabId: Tab['id'];
        tabIndex: number;
      }) => React.ReactNode)
    | React.ReactNode;
};

type Props = {
  tabs: (Tab | undefined)[];
  renderContainerHeader?: (p: {
    tabs: React.ReactNode[];
    focus: (tabIndex: number, tabStackIndex?: number) => void;
    focusByTabId: (tabId: Tab['id'], tabStackIndex?: number) => void;
  }) => React.ReactNode;
  currentIndex?: number;
  currentTabId?: Tab['id'];
  currentTabStackIndex?: number;
  containerClassName?: string;
  headerContainerClassName?: string;
  contentClassName?: string;
  onTabChange?: (p: { tabId: Tab['id']; tabIndex: number }) => void;
  onTabStackIndexChanged?: (p: {
    tabId: Tab['id'];
    tabIndex: number;
    stackIndex: number;
  }) => void;
};

const isInBoundariesOr = (i: number, tabs: unknown[], or: number): number =>
  i > -1 && i < tabs.length ? i : or;

type TabIndex = {
  tabIndex: number;
  stackindex: number; // This is the deeper layer
};

const tabIdToIndex = (tabs: (Tab | undefined)[], id: Tab['id']) =>
  tabs.findIndex((t) => t?.id === id);

export type TabsRef = {
  nav: TabsNav;
  focus: (tabIndex: number, tabStackIndex?: number) => void;
  focusByTabId: (tabId: string, tabStackIndex?: number) => void;
  currentTabIndex: number;
};

export const Tabs = React.forwardRef<TabsRef, Props>((props, ref) => {
  const [currentTabIndex, setCurrentTabIndex] = useState(
    isInBoundariesOr(props.currentIndex || 0, props.tabs, 0)
  );

  const [currentStackIndex, setCurrentStackIndex] = useState(
    props.currentTabStackIndex || 0
  );

  const currentTab = props.tabs[currentTabIndex];

  const changeStackIndex = (toStackIndex: number) => {
    if (!currentTab) {
      return;
    }

    setCurrentStackIndex(toStackIndex);

    props.onTabStackIndexChanged?.({
      tabId: currentTab.id,
      tabIndex: currentTabIndex,
      stackIndex: toStackIndex,
    });
  };

  useEffect(() => {
    setCurrentTabIndex(
      isInBoundariesOr(props.currentIndex || 0, props.tabs, 0)
    );
  }, [props.currentIndex]);

  useEffect(() => {
    if (props.currentTabId) {
      const tabIndex = tabIdToIndex(props.tabs, props.currentTabId);

      if (tabIndex > -1) {
        setCurrentTabIndex(tabIndex);
      }
      // Otherwise don't do anything?
    }
  }, [props.currentTabId]);

  const focus = (tabIndex: number, tabStackIndex?: number) => {
    setCurrentTabIndex(tabIndex);

    const currentTab = props.tabs[tabIndex];
    if (currentTab) {
      props.onTabChange?.({ tabId: currentTab.id, tabIndex });
    }

    // Reset the stack index each time

    // TODO: Look into this - is it still needed to be reset to 0 or to the set one?
    setCurrentStackIndex(tabStackIndex || 0);
  };

  useEffect(() => {
    const ct = props.tabs[currentTabIndex];
    if (ct) {
      // console.log('Tabs.useEffect() calling onTabChange')
      props.onTabChange?.({ tabId: ct.id, tabIndex: currentTabIndex });
    }
  }, [currentTabIndex, props.onTabChange]);

  const renderHeaderComponent = () => {
    const tabs = props.tabs.map((tab, i) => {
      return (
        <div key={i}>
          {tab?.renderHeader({
            focus: () => focus(i),
            isFocused: i === currentTabIndex,
            tabId: tab.id,
            tabIndex: i,
          })}
        </div>
      );
    });

    if (props.renderContainerHeader) {
      return props.renderContainerHeader({
        tabs,
        focus,
        focusByTabId: (tabId) => focus(tabIdToIndex(props.tabs, tabId) || 0),
      });
    }

    return (
      <div className={`flex flex-row ${props.headerContainerClassName}`}>
        {tabs.map((c) => c)}
      </div>
    );
  };

  // The internal Stack Navigation
  const nav = {
    stackPush: () => {
      changeStackIndex(currentStackIndex + 1);
    },
    stackBack: () => {
      changeStackIndex(
        currentStackIndex > 0 ? currentStackIndex - 1 : currentStackIndex
      );
    },
    stackPop: () => {
      changeStackIndex(0);
    },
    stackTo: changeStackIndex,
    stackIndex: currentStackIndex,
  };

  // This sets the Ref
  useImperativeHandle(
    ref,
    () => ({
      focus,
      focusByTabId: (tabId, tabStackIndex) =>
        focus(tabIdToIndex(props.tabs, tabId) || 0, tabStackIndex),
      nav,
      currentTabIndex,
    }),
    [focus, nav, currentTabIndex]
  );

  const contentComponent =
    typeof currentTab?.renderContent === 'function'
      ? currentTab.renderContent({
          focus: () => focus(currentTabIndex),
          isFocused: true,
          tabId: currentTab.id,
          tabIndex: currentTabIndex,
          nav,
        })
      : currentTab?.renderContent;

  return (
    <div className={props.containerClassName}>
      {renderHeaderComponent()}
      <div className={`flex-1 ${props.contentClassName}`}>
        {contentComponent}
      </div>
    </div>
  );
});
