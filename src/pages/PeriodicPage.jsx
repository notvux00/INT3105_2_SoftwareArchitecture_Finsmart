import React from "react";
import { Sidebar } from "../shared/ui";
import { PeriodicDashboard } from "../widgets/PeriodicDashboard";

const PeriodicPage = () => {
  return (
    <div className="bodyPre">
      <Sidebar currentPath="/preodic" />
      {/* Render trực tiếp Dashboard (là Fragment) vào đây */}
      {/* Lúc này DOM sẽ là: div.bodyPre > [Sidebar, Table, Notice] -> Flex Row chuẩn */}
      <PeriodicDashboard />
    </div>
  );
};

export default PeriodicPage;
