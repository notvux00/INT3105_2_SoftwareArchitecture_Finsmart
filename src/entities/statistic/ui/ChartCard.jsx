import React from "react";
import { FaCalendarAlt } from "react-icons/fa";

const ChartCard = ({
  title,
  onFilterClick,
  children,
  className = "",
  extraContent,
}) => {
  return (
    <div
      className={`statistic-cell ${className}`}
      style={{ position: "relative" }}
    >
      <div className="chart-header">
        <span className="chart-title">{title}</span>
        <button className="calendar-btn" onClick={onFilterClick}>
          <FaCalendarAlt />
        </button>
      </div>

      {extraContent}

      <div className="chart-content">{children}</div>
    </div>
  );
};

export default ChartCard;
