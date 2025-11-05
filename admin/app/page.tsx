import DashboardLayout from "./components/DashboardLayout";
import AccountBalance from "./components/AccountBalance";
import StatsCards from "./components/StatsCards";
import MapSection from "./components/MapSection";
import ActivityChart from "./components/ActivityChart";

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
