"use client";

import { useState, useEffect, ReactNode } from "react";
import SideNav from "./SideNav";
import TopNav from "./TopNav";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [isSideNavCollapsed, setIsSideNavCollapsed] = useState(false);

  // Load collapse state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem("sideNavCollapsed");
    if (savedState !== null) {
      setIsSideNavCollapsed(savedState === "true");
    }
  }, []);

  const toggleSideNav = () => {
    const newState = !isSideNavCollapsed;
    setIsSideNavCollapsed(newState);
    // Save to localStorage
    localStorage.setItem("sideNavCollapsed", String(newState));
  };

  return (
    <div className="app-container">
      <TopNav />
      <div className="main-content">
        <SideNav isCollapsed={isSideNavCollapsed} onToggle={toggleSideNav} />
        <main
          className={`page-content ${
            isSideNavCollapsed ? "page-content--collapsed" : ""
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
