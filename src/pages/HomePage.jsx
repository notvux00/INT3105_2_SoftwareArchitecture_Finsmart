import React, { useState, useEffect } from "react";
import "../frontend/pages/Home.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../shared/hooks";
import { useUser } from "../entities/user";
import { useTransactions } from "../entities/transaction";
import { useBudgets, SpendingLimitsPanel } from "../entities/budget";
import { TransactionList } from "../widgets";
import { Sidebar } from "../shared/ui"; // Import Sidebar dùng chung
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const HomePage = () => {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { username, balance, loading: userLoading } = useUser(userId);
  const {
    history,
    chartData,
    chartDataDefault,
    totalIncome: initialTotalIncome,
    totalIncomeDefault,
    totalExpense: initialTotalExpense,
    totalExpenseDefault,
    loading: transactionLoading,
  } = useTransactions(userId);

  const {
    budgets,
    addBudget,
    updateBudget,
    deleteBudget,
    checkAndResetBudgets,
  } = useBudgets(userId);

  const [totalIncome, setTotalIncome] = useState(initialTotalIncome);
  const [totalExpense, setTotalExpense] = useState(initialTotalExpense);

  const [chartStartDate, setChartStartDate] = useState("");
  const [chartEndDate, setChartEndDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filteredChartData, setFilteredChartData] = useState([]);
  const [currentDateTime, setCurrentDateTime] = useState("");

  const loading = userLoading || transactionLoading;

  const handleTransaction = () => navigate("/transaction");
  const handleHistory = () => navigate("/history");

  const handleFilterChart = () => {
    if (!chartStartDate || !chartEndDate) return;

    const start = new Date(chartStartDate);
    const end = new Date(chartEndDate);
    end.setHours(23, 59, 59, 999);

    const filtered = chartData.filter((item) => {
      const [day, month, year] = item.date.split("/");
      const itemDate = new Date(`${year}-${month}-${day}`);
      return itemDate >= start && itemDate <= end;
    });

    setFilteredChartData(filtered);

    const filteredIncomeData = filtered.map((item) => item.income);
    const filteredExpenseData = filtered.map((item) => item.expense);

    const totalIncomeFiltered = filteredIncomeData.reduce(
      (sum, amount) => sum + amount,
      0
    );
    const totalExpenseFiltered = filteredExpenseData.reduce(
      (sum, amount) => sum + amount,
      0
    );

    setTotalIncome(totalIncomeFiltered);
    setTotalExpense(totalExpenseFiltered);
    setShowDatePicker(false);
  };

  const resetChartFilter = () => {
    setChartStartDate("");
    setChartEndDate("");
    setFilteredChartData([]);

    const totalIncomeAll = chartData.reduce(
      (sum, item) => sum + item.income,
      0
    );
    const totalExpenseAll = chartData.reduce(
      (sum, item) => sum + item.expense,
      0
    );

    setTotalIncome(totalIncomeAll);
    setTotalExpense(totalExpenseAll);
    setShowDatePicker(false);
  };

  const getFormattedDateTime = () => {
    const now = new Date();
    const datePart = now.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const timePart = now.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    return `${datePart}, ${timePart}`;
  };

  useEffect(() => {
    setCurrentDateTime(getFormattedDateTime());
    const timer = setInterval(() => {
      setCurrentDateTime(getFormattedDateTime());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (budgets.length > 0) {
      const interval = setInterval(() => {
        checkAndResetBudgets();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [budgets, checkAndResetBudgets]);

  return (
    <div className="bodyhome">
      {/* THAY THẾ SIDEBAR CŨ BẰNG COMPONENT MỚI */}
      <Sidebar currentPath="/home" />

      <div className="main-content">
        <h1>Xin chào {loading ? "Đang tải..." : username || "Người dùng"}!</h1>
        <div className="balance-card">
          <p>Tổng số dư</p>
          <h2>{loading ? "Đang tải..." : balance}</h2>
        </div>

        <TransactionList history={history} onViewAll={handleHistory} />

        <div className="chart-container">
          <div className="chart-header" style={{ position: "relative" }}>
            <h3>Biểu Đồ Thu Chi</h3>
            <button
              className="calendar-button"
              onClick={() => setShowDatePicker(!showDatePicker)}
            >
              📅
            </button>

            {showDatePicker && (
              <div className="date-picker-popup">
                <label>
                  Từ:
                  <input
                    type="date"
                    value={chartStartDate}
                    onChange={(e) => setChartStartDate(e.target.value)}
                  />
                </label>
                <label>
                  Đến:
                  <input
                    type="date"
                    value={chartEndDate}
                    onChange={(e) => setChartEndDate(e.target.value)}
                  />
                </label>
                <div className="date-picker-buttons">
                  <button onClick={handleFilterChart}>Lọc</button>
                  <button
                    onClick={resetChartFilter}
                    style={{ marginLeft: "8px" }}
                  >
                    Xóa lọc
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="chart-content">
            <div className="chart-image">
              {filteredChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={filteredChartData}>
                    <CartesianGrid stroke="#ccc" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={() => ""}
                      stroke="#ccc"
                    />
                    <YAxis tickFormatter={() => ""} stroke="#ccc" />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="income"
                      stroke="#4caf50"
                      name="Thu Vào"
                    />
                    <Line
                      type="monotone"
                      dataKey="expense"
                      stroke="#f44336"
                      name="Chi Tiêu"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartDataDefault}>
                    <CartesianGrid stroke="#ccc" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={() => ""}
                      stroke="#ccc"
                    />
                    <YAxis tickFormatter={() => ""} stroke="#ccc" />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="income"
                      stroke="#4caf50"
                      name="Thu Vào"
                    />
                    <Line
                      type="monotone"
                      dataKey="expense"
                      stroke="#f44336"
                      name="Chi Tiêu"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="chart-summary">
              {filteredChartData.length > 0 ? (
                <>
                  <div className="summary-item">
                    <img
                      src="Soucre/Income.png"
                      alt="Thu Vào"
                      className="summary-icon"
                    />
                    <div className="income">
                      <p>Thu Vào</p>
                      <h2>{totalIncome.toLocaleString()}₫</h2>
                    </div>
                  </div>
                  <div className="summary-item">
                    <img
                      src="Soucre/Outcome.png"
                      alt="Chi Tiêu"
                      className="summary-icon"
                    />
                    <div className="expense">
                      <p>Chi Tiêu</p>
                      <h2>{totalExpense.toLocaleString()}₫</h2>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="summary-item">
                    <img
                      src="Soucre/Income.png"
                      alt="Thu Vào"
                      className="summary-icon"
                    />
                    <div className="income">
                      <p>Thu Vào</p>
                      <h2>{totalIncomeDefault.toLocaleString()}₫</h2>
                    </div>
                  </div>
                  <div className="summary-item">
                    <img
                      src="Soucre/Outcome.png"
                      alt="Chi Tiêu"
                      className="summary-icon"
                    />
                    <div className="expense">
                      <p>Chi Tiêu</p>
                      <h2>{totalExpenseDefault.toLocaleString()}₫</h2>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="right-panel">
        <p id="currentTime">{currentDateTime}</p>
        <SpendingLimitsPanel
          budgets={budgets}
          onAddBudget={addBudget}
          onUpdateBudget={updateBudget}
          onDeleteBudget={deleteBudget}
        />
      </div>
    </div>
  );
};

export default HomePage;
