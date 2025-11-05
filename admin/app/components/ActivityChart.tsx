"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const ActivityChart = () => {
  const data = [
    { day: "Mon", rides: 45, deliveries: 32 },
    { day: "Tue", rides: 52, deliveries: 28 },
    { day: "Wed", rides: 61, deliveries: 70 },
    { day: "Thu", rides: 58, deliveries: 38 },
    { day: "Fri", rides: 37, deliveries: 52 },
    { day: "Sat", rides: 88, deliveries: 65 },
    { day: "Sun", rides: 56, deliveries: 67 },
  ];

  return (
    <div className="activity-chart">
      <h2 className="activity-chart__title">Daily Activity Overview</h2>
      <div className="activity-chart__content">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="day"
              stroke="#6b7280"
              style={{ fontSize: "0.875rem" }}
            />
            <YAxis stroke="#6b7280" style={{ fontSize: "0.875rem" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: "0.875rem", paddingTop: "1rem" }}
            />
            <Line
              type="monotone"
              dataKey="rides"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={{ fill: "#f59e0b", r: 5 }}
              activeDot={{ r: 7 }}
              name="Rides"
            />
            <Line
              type="monotone"
              dataKey="deliveries"
              stroke="#ec4899"
              strokeWidth={3}
              dot={{ fill: "#ec4899", r: 5 }}
              activeDot={{ r: 7 }}
              name="Deliveries"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ActivityChart;
