import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../shared/hooks";
import { useTransactionHistory } from "../entities/transaction"; // Hook mới chúng ta vừa làm
import { Sidebar } from "../shared/ui";
import "../frontend/pages/History.css"; // Tạm dùng CSS cũ để giữ giao diện

const HistoryPage = () => {
  const navigate = useNavigate();
  const { userId } = useAuth();

  // State quản lý bộ lọc
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Hàm tạo object filter để truyền vào Hook
  // Hook sẽ tự động gọi lại API khi object này thay đổi
  const getFilterParams = () => {
    let filters = {};
    if (startDate) filters.startDate = new Date(startDate).toISOString();
    if (endDate) {
      // Với ngày kết thúc, ta cần lấy đến cuối ngày (23:59:59)
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filters.endDate = end.toISOString();
    }
    return filters;
  };

  // Gọi Hook: Dữ liệu sẽ được Cache và tự động cập nhật
  const { transactions, isLoading, isError } = useTransactionHistory(
    userId,
    getFilterParams()
  );

  return (
    <div className="bodyStatistic" style={{ display: "flex" }}>
      {" "}
      {/* Layout Flex giống Statistic */}
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

        {/* Khu vực bộ lọc */}
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

        {/* Danh sách giao dịch */}
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
                {/* Icon hoặc Tên danh mục */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <p style={{ margin: 0 }}>{t.category}</p>
                </div>

                {/* Ghi chú (nếu có) */}
                {t.note && (
                  <small className="note" style={{ color: "#888" }}>
                    {t.note}
                  </small>
                )}

                {/* Ngày tháng */}
                <span>
                  {new Date(t.created_at).toLocaleString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </span>

                {/* Số tiền (Xanh nếu thu, Đỏ nếu chi) */}
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
