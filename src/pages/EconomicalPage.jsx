import React from "react";
import { Sidebar } from "../shared/ui";
import { EconomicalDashboard } from "../widgets/EconomicalDashboard";

// Import CSS cũ để đảm bảo style của dashboard (vì chúng ta chưa move CSS vào widget)
import "../frontend/pages/Economical.css";

const EconomicalPage = () => {
  return (
    <div className="bodyEco">
      {" "}
      {/* Class này giữ layout flex cho trang */}
      <Sidebar currentPath="/economical" />
      <EconomicalDashboard />
    </div>
  );
};

export default EconomicalPage;
