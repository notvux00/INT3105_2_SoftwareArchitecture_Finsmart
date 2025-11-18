import "./Statistic.css";
import { statisticRepository } from '../../entities/statistic/api/statisticRepository';
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import CryptoJS from "crypto-js";
import supabase from "../../database/supabase";
import { Pie, Bar, Line } from "react-chartjs-2";
import Chart from "chart.js/auto";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaCalendarAlt } from "react-icons/fa";

const SECRET_KEY = process.env.REACT_APP_SECRET_KEY;
const encryptedUserId = localStorage.getItem("user_id");
let user_id = 0;
if (encryptedUserId && SECRET_KEY) {
  const bytes = CryptoJS.AES.decrypt(encryptedUserId, SECRET_KEY);
  user_id = parseInt(bytes.toString(CryptoJS.enc.Utf8), 10);
}

function Statistic() {
  const navigate = useNavigate();
  const handleHome = () => navigate("/home");
  const handleTransaction = () => navigate("/transaction");
  const handleAI = () => navigate("/ai");
  const handleProfile = () => navigate("/profile");
  const handleEconomical = () => navigate("/economical");
  const handlePreodic = () => navigate("/preodic");

  const [pieData, setPieData] = useState(null);
  const [barData, setBarData] = useState(null);
  const [lineData, setLineData] = useState(null);

  // Filter state
  const [pieFilter, setPieFilter] = useState({ from: null, to: null });
  const [barFilter, setBarFilter] = useState({ from: null, to: null });
  const [lineFilter, setLineFilter] = useState({ from: null, to: null });

  // Popup show/hide state
  const [showPieFilter, setShowPieFilter] = useState(false);
  const [showBarFilter, setShowBarFilter] = useState(false);
  const [showLineFilter, setShowLineFilter] = useState(false);

  // Temp filter state for popup
  const [tempPieFilter, setTempPieFilter] = useState({ from: null, to: null });
  const [tempBarFilter, setTempBarFilter] = useState({ from: null, to: null });
  const [tempLineFilter, setTempLineFilter] = useState({
    from: null,
    to: null,
  });

  useEffect(() => {
    fetchStatistic();
    // eslint-disable-next-line
  }, [pieFilter, barFilter, lineFilter]);

  const fetchStatistic = async () => {
      if (!user_id) return;

      try {
        // --- 1. Pie Chart (Category) ---
        // Gọi trực tiếp vào View đã tạo ở Bước 1
        const { data: categoryData, error: catError } = await supabase
          .from('view_expenses_by_category') 
          .select('category, total_amount')
          .eq('user_id', user_id);

        if (catError) throw catError;

        // Xử lý dữ liệu cho ChartJS (Code ngắn gọn hơn nhiều do DB đã tính tổng)
        const labels = categoryData.map(item => item.category);
        const dataValues = categoryData.map(item => item.total_amount);

        setPieData({
          labels: labels,
          datasets: [{
            label: "Tổng chi tiêu",
            data: dataValues,
            backgroundColor: [
              "#ff6384", "#36a2eb", "#ffce56", "#4bc0c0", 
              "#9966ff", "#ff9f40", "#8bc34a", "#e91e63", "#607d8b"
            ],
          }],
        });

        // --- 2. Bar & Line Chart (Monthly) ---
        let monthlyQuery = supabase
          .from('view_monthly_stats')
          .select('*')
          .eq('user_id', user_id)
          .order('month', { ascending: true });

        // Áp dụng bộ lọc thời gian nếu có (lọc trên cột 'month' của View)
        if (barFilter.from) monthlyQuery = monthlyQuery.gte('month', barFilter.from.toISOString());
        if (barFilter.to) monthlyQuery = monthlyQuery.lte('month', barFilter.to.toISOString());

        const { data: monthlyData, error: monthError } = await monthlyQuery;
        if (monthError) throw monthError;

        // Chuẩn bị dữ liệu hiển thị
        const months = monthlyData.map(item => {
          // Format lại ngày tháng cho đẹp (VD: 2023-10)
          return item.month.substring(0, 7); 
        });
        
        // Bar Chart Data
        setBarData({
          labels: months,
          datasets: [
            {
              label: "Thu nhập",
              backgroundColor: "#77dd77",
              data: monthlyData.map(item => item.total_income),
            },
            {
              label: "Chi tiêu",
              backgroundColor: "#ef5350",
              data: monthlyData.map(item => item.total_expense),
            },
          ],
        });

        // Line Chart Data (Số dư tích lũy)
        // Nếu muốn số dư cộng dồn theo thời gian thực tế, ta cần tính lũy kế
        let accumulatedBalance = 0;
        const balanceData = monthlyData.map(item => {
            accumulatedBalance += item.net_balance;
            return accumulatedBalance;
        });

        setLineData({
          labels: months,
          datasets: [
            {
              label: "Số dư ví (Tích lũy)",
              data: balanceData,
              borderColor: "#388e3c",
              backgroundColor: "#388e3c",
              fill: false,
            },
          ],
        });

      } catch (error) {
        console.error("Lỗi tải dữ liệu thống kê:", error.message);
      }
  };

  // Popup filter component
  const renderFilterPopup = (
    tempFilter,
    setTempFilter,
    setFilter,
    setShowFilter
  ) => (
    <div className="filter-popup">
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
        <button
          onClick={() => {
            setFilter(tempFilter);
            setShowFilter(false);
          }}
        >
          Xác nhận
        </button>
        <button
          onClick={() => {
            setFilter({ from: null, to: null });
            setTempFilter({ from: null, to: null });
            setShowFilter(false);
          }}
        >
          Xoá bộ lọc
        </button>
      </div>
    </div>
  );

  // Chart render with popup filter
  const renderChart = (
    ChartComponent,
    data,
    title,
    filter,
    setFilter,
    showFilter,
    setShowFilter,
    tempFilter,
    setTempFilter
  ) => (
    <div className="statistic-cell">
      <div className="chart-header">
        <span className="chart-title">{title}</span>
        <button
          className="calendar-btn"
          onClick={() => {
            setTempFilter(filter);
            setShowFilter(true);
          }}
        >
          <FaCalendarAlt />
        </button>
      </div>
      {showFilter &&
        renderFilterPopup(tempFilter, setTempFilter, setFilter, setShowFilter)}
      {data ? (
        <ChartComponent
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: "bottom", labels: { padding: 15 } },
              title: { display: false },
            },
            layout: { padding: 10 },
          }}
        />
      ) : (
        <p>Đang tải dữ liệu...</p>
      )}
    </div>
  );

  return (
    <div className="bodyStatistic">
      <div className="sidebarhome">
        <div className="logo">
          <img src="Soucre/Logo.png" alt="Logo FinSmart" />
          <span className="logo-text">FinSmart</span>
        </div>
        <nav>
          <button className="nav-btn home" onClick={handleHome}>
            <img src="Soucre/Dashboard.png" alt="Trang chủ" />
            <span className="nav-label">Trang chủ</span>
          </button>
          <button className="nav-btn add" onClick={handleTransaction}>
            <img src="Soucre/AddTransaction.png" alt="Thêm Giao dịch" />
            <span className="nav-label">Giao dịch</span>
          </button>
          <button className="nav-btn eco" onClick={handlePreodic}>
            <img src="Soucre/preodic-icon.png" alt="Tiết kiệm" />
            <span className="nav-label">Định kỳ</span>
          </button>
          <button className="nav-btn eco">
            <img src="Soucre/statistic.png" alt="Thống kê" />
            <span className="nav-label">Thống kê</span>
          </button>
          <button className="nav-btn eco" onClick={handleEconomical}>
            <img src="Soucre/economy-icon.png" alt="Tiết kiệm" />
            <span className="nav-label">Tiết kiệm</span>
          </button>
          <button className="nav-btn AI" onClick={handleAI}>
            <img src="Soucre/AI.png" alt="Chatbot" />
            <span className="nav-label">Chatbot</span>
          </button>
          <button className="nav-btn user" onClick={handleProfile}>
            <img src="Soucre/Logout.png" alt="Đăng xuất" />
            <span className="nav-label">Thông tin cá nhân</span>
          </button>
        </nav>
      </div>

      <div className="mainStatistic">
        <div className="statistic-grid">
          {renderChart(
            Pie,
            pieData,
            "Chi tiêu theo danh mục",
            pieFilter,
            setPieFilter,
            showPieFilter,
            setShowPieFilter,
            tempPieFilter,
            setTempPieFilter
          )}
          {renderChart(
            Bar,
            barData,
            "Thu chi theo tháng",
            barFilter,
            setBarFilter,
            showBarFilter,
            setShowBarFilter,
            tempBarFilter,
            setTempBarFilter
          )}

          {/* Thêm đoạn này để line chart chiếm hàng dưới */}
          <div className="statistic-cell statistic-cell-wide">
            <div className="chart-header">
              <span className="chart-title">Số dư ví theo thời gian</span>
              <button
                className="calendar-btn"
                onClick={() => {
                  setTempLineFilter(lineFilter);
                  setShowLineFilter(true);
                }}
              >
                <FaCalendarAlt />
              </button>
            </div>
            {showLineFilter &&
              renderFilterPopup(
                tempLineFilter,
                setTempLineFilter,
                setLineFilter,
                setShowLineFilter
              )}
            {lineData ? (
              <Line
                data={lineData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: "bottom", labels: { padding: 5 } },
                    title: { display: false },
                  },
                  layout: { padding: 10 },
                }}
              />
            ) : (
              <p>Đang tải dữ liệu...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default Statistic;
