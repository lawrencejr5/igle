"use client";

import { useState } from "react";

interface TabSwitcherProps {
  tabs: string[];
  onTabChange?: (activeTab: string) => void;
}

const TabSwitcher = ({ tabs, onTabChange }: TabSwitcherProps) => {
  const [activeTab, setActiveTab] = useState(tabs[0]);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  return (
    <div className="tab-switcher">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={`tab-switcher__tab ${
            activeTab === tab ? "tab-switcher__tab--active" : ""
          }`}
          onClick={() => handleTabClick(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export default TabSwitcher;
