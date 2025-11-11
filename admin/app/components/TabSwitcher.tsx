"use client";

import { useState } from "react";

interface TabSwitcherProps {
  tabs: string[];
  activeTab: string;
  onTabChange?: (activeTab: string) => void;
}

const TabSwitcher = ({ tabs, activeTab, onTabChange }: TabSwitcherProps) => {
  const handleTabClick = (tab: string) => {
    if (onTabChange) {
      // Extract the base tab name (without count) for the callback
      const baseTabName = tab.split(" (")[0];
      onTabChange(baseTabName);
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
