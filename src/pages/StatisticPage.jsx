import React from "react";
import { Sidebar } from "../shared/ui";
import { StatisticDashboard } from "../widgets/StatisticDashboard";
import "../frontend/pages/Statistic.css"; // Import CSS cũ (hoặc bạn move CSS vào widget)

const StatisticPage = () => {
  return (
    <div className="bodyStatistic">
      <Sidebar currentPath="/statistic" />
      <StatisticDashboard />
    </div>
  );
};

export default StatisticPage;
