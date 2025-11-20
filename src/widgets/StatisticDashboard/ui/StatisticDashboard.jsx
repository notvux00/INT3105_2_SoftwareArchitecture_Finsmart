import React, { useState } from "react";
import { Pie, Bar, Line } from "react-chartjs-2";
import "chart.js/auto";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { useAuth } from "../../../shared/hooks";
import { useStatistics, ChartCard } from "../../../entities/statistic";
import "../../../frontend/pages/Statistic.css";

const StatisticDashboard = () => {
  const { userId } = useAuth();

  const [filters, setFilters] = useState({
    pie: { from: null, to: null },
    bar: { from: null, to: null },
    line: { from: null, to: null },
  });

  const [activePopup, setActivePopup] = useState(null);
  const [tempFilter, setTempFilter] = useState({ from: null, to: null });

  const { pieData, barData, lineData, isLoading } = useStatistics(
    userId,
    filters
  );

  const openPopup = (type) => {
    setTempFilter(filters[type]);
    setActivePopup(type);
  };

  const applyFilter = () => {
    setFilters((prev) => ({ ...prev, [activePopup]: tempFilter }));
    setActivePopup(null);
  };

  const clearFilter = () => {
    setFilters((prev) => ({
      ...prev,
      [activePopup]: { from: null, to: null },
    }));
    setActivePopup(null);
  };

  // Component Popup
  const FilterPopup = () => (
    <div className="filter-popup" onClick={(e) => e.stopPropagation()}>
      <DatePicker
        selected={tempFilter.from}
        onChange={(date) => setTempFilter((prev) => ({ ...prev, from: date }))}
        placeholderText="Từ ngày"
        dateFormat="yyyy-MM-dd"
        isClearable
      />
      <DatePicker
        selected={tempFilter.to}
        onChange={(date) => setTempFilter((prev) => ({ ...prev, to: date }))}
        placeholderText="Đến ngày"
        dateFormat="yyyy-MM-dd"
        isClearable
      />
      <div className="filter-actions">
        <button onClick={applyFilter}>Xác nhận</button>
        <button onClick={clearFilter}>Xoá bộ lọc</button>
      </div>
    </div>
  );

  if (isLoading)
    return <div className="loading">Đang tải dữ liệu thống kê...</div>;

  return (
    <div className="mainStatistic">
      <div className="statistic-grid">
        {/* 1. PIE CHART - Không còn div bao ngoài */}
        <ChartCard
          title="Chi tiêu theo danh mục"
          onFilterClick={() => openPopup("pie")}
          extraContent={activePopup === "pie" && <FilterPopup />}
        >
          {pieData ? (
            <Pie data={pieData} options={{ maintainAspectRatio: false }} />
          ) : (
            <p>Chưa có dữ liệu</p>
          )}
        </ChartCard>

        {/* 2. BAR CHART */}
        <ChartCard
          title="Thu chi theo tháng"
          onFilterClick={() => openPopup("bar")}
          extraContent={activePopup === "bar" && <FilterPopup />}
        >
          {barData ? (
            <Bar data={barData} options={{ maintainAspectRatio: false }} />
          ) : (
            <p>Chưa có dữ liệu</p>
          )}
        </ChartCard>

        {/* 3. LINE CHART - Thêm class statistic-cell-wide */}
        <ChartCard
          title="Số dư ví theo thời gian"
          onFilterClick={() => openPopup("line")}
          className="statistic-cell-wide" // Class này sẽ được cộng dồn vào class gốc
          extraContent={activePopup === "line" && <FilterPopup />}
        >
          {lineData ? (
            <Line data={lineData} options={{ maintainAspectRatio: false }} />
          ) : (
            <p>Chưa có dữ liệu</p>
          )}
        </ChartCard>
      </div>
    </div>
  );
};

export default StatisticDashboard;
