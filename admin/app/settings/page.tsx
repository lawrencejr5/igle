"use client";

import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import TabSwitcher from "../components/TabSwitcher";
import ProfileSettings from "../components/ProfileSettings";
import SystemSettings from "../components/SystemSettings";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<
    "Profile Settings" | "System Settings"
  >("Profile Settings");

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as "Profile Settings" | "System Settings");
  };

  return (
    <DashboardLayout>
      <div className="settings-page">
        {/* Page Header */}
        <div className="page__header">
          <div>
            <h1 className="page__title">Settings</h1>
            <p className="page__subtitle">
              Manage your profile and system configurations
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="settings-page__tabs">
          <TabSwitcher
            tabs={["Profile Settings", "System Settings"]}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </div>

        {/* Tab Content */}
        <div className="settings-page__content">
          {activeTab === "Profile Settings" && <ProfileSettings />}
          {activeTab === "System Settings" && <SystemSettings />}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
