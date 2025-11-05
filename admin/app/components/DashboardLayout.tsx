"use client";

import { useState, ReactNode } from "react";
import SideNav from "./SideNav";
import TopNav from "./TopNav";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [isSideNavCollapsed, setIsSideNavCollapsed] = useState(false);

  const toggleSideNav = () => {
    setIsSideNavCollapsed(!isSideNavCollapsed);
  };

  return (
    <div className="app-container">
      <TopNav />
      <div className="main-content">
        <SideNav isCollapsed={isSideNavCollapsed} onToggle={toggleSideNav} />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
