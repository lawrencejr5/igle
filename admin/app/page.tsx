import DashboardLayout from "./components/DashboardLayout";
import AccountBalance from "./components/Overview/AccountBalance";
import StatsCards from "./components/Overview/StatsCards";
import MapSection from "./components/Overview/MapSection";
import ActivityChart from "./components/Overview/ActivityChart";

const Overview = () => {
  return (
    <DashboardLayout>
      <h1 className="page-header">Overview</h1>
      <AccountBalance />
      <StatsCards />
      <ActivityChart />
      <MapSection />
    </DashboardLayout>
  );
};

export default Overview;
