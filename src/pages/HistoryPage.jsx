import React, { useState, useMemo } from "react"; // 1. Thêm useMemo
import { useNavigate } from "react-router-dom";
import { useAuth } from "../shared/hooks";
import { useTransactionHistory } from "../entities/transaction";
import { Sidebar } from "../shared/ui";
import "../frontend/pages/History.css";
import "../frontend/pages/Statistic.css"; // 2. Import thêm file này để lấy class bodyStatistic và sidebarhome

const HistoryPage = () => {
  const navigate = useNavigate();
  const { userId } = useAuth();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // 3. SỬA LỖI QUAN TRỌNG: Dùng useMemo để tránh vòng lặp vô tận
  const filters = useMemo(() => {
    let params = {};
    if (startDate) params.startDate = new Date(startDate).toISOString();
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      params.endDate = end.toISOString();
    }
    return params;
  }, [startDate, endDate]); // Chỉ tạo lại object khi ngày thay đổi

  // Truyền filters đã memoize vào hook
  const { transactions, isLoading, isError } = useTransactionHistory(
    userId,
    filters
  );

  return (
    // Class bodyStatistic giờ đã có tác dụng nhờ import CSS ở trên
    <div className="bodyStatistic">
      <Sidebar currentPath="/history" />
      <div
        className="history"
        style={{
          flex: 1,
          margin: "20px",
          height: "95vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h3>Lịch Sử Giao Dịch</h3>

        {/* ... (Phần còn lại giữ nguyên) ... */}
        <div className="filters">
          <label>
            Từ ngày:
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label>
            Đến ngày:
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
        </div>

        <div
          className="transaction-list-hist"
          style={{ flex: 1, overflowY: "auto" }}
        >
          {isLoading ? (
            <p style={{ textAlign: "center", marginTop: "20px" }}>
              Đang tải dữ liệu...
            </p>
          ) : isError ? (
            <p style={{ textAlign: "center", color: "red" }}>
              Có lỗi xảy ra khi tải dữ liệu.
            </p>
          ) : transactions.length > 0 ? (
            transactions.map((t, index) => (
              <div key={index} className="transaction-hist">
                {/* ... Code render item giữ nguyên ... */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <p style={{ margin: 0 }}>{t.category}</p>
                </div>
                {t.note && (
                  <small className="note" style={{ color: "#888" }}>
                    {t.note}
                  </small>
                )}
                <span>
                  {new Date(t.created_at).toLocaleString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className={t.type === "income" ? "positive" : "negative"}>
                  {t.type === "expense" ? "-" : "+"}
                  {t.amount.toLocaleString("vi-VN")}
                </span>
              </div>
            ))
          ) : (
            <p
              style={{ textAlign: "center", marginTop: "20px", color: "#666" }}
            >
              Không có giao dịch nào trong khoảng thời gian này.
            </p>
          )}
        </div>

        <button className="back-home" onClick={() => navigate("/home")}>
          Quay lại Home
        </button>
      </div>
    </div>
  );
};

export default HistoryPage;
