"use client";

import { useEffect } from "react";
import {
  FaUsers,
  FaCar,
  FaRoute,
  FaDollarSign,
  FaTruck,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useAdminContext } from "../../context/AdminContext";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
}

const StatCard = ({ title, value, icon, iconBg }: StatCardProps) => {
  return (
    <div className="stat-card">
      <div className="stat-card__icon" style={{ backgroundColor: iconBg }}>
        {icon}
      </div>
      <div className="stat-card__content">
        <p className="stat-card__title">{title}</p>
        <h2 className="stat-card__value">{value}</h2>
      </div>
    </div>
  );
};

const StatsCards = () => {
  const { summary, fetchSummary } = useAdminContext();

  useEffect(() => {
    fetchSummary();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const stats = [
    {
      title: "Total Users",
      value: summary?.totalUsers?.toLocaleString() || "0",
      icon: <FaUsers />,
      iconBg: "#3b82f6", // blue
    },
    {
      title: "Active Drivers",
      value: summary?.activeDrivers?.toLocaleString() || "0",
      icon: <FaCar />,
      iconBg: "#10b981", // green
    },
    {
      title: "Active Rides",
      value: summary?.activeRides?.toLocaleString() || "0",
      icon: <FaRoute />,
      iconBg: "#f59e0b", // amber
    },
    {
      title: "Total Revenue This Month",
      value: formatCurrency(summary?.totalRevenueThisMonth || 0),
      icon: <FaDollarSign />,
      iconBg: "#8b5cf6", // purple
    },
    {
      title: "Active Deliveries",
      value: summary?.activeDeliveries?.toLocaleString() || "0",
      icon: <FaTruck />,
      iconBg: "#ec4899", // pink
    },
    {
      title: "Total Reports",
      value: summary?.totalReports?.toLocaleString() || "0",
      icon: <FaExclamationTriangle />,
      iconBg: "#ef4444", // red
    },
  ];

  return (
    <div className="stats-grid">
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          iconBg={stat.iconBg}
        />
      ))}
    </div>
  );
};

export default StatsCards;
