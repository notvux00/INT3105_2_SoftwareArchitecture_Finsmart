import React from "react";
import { useSystemHealth } from "../hooks/useSystemHealth";

const SystemStatus = () => {
  const status = useSystemHealth();

  const getStatusColor = () => {
    switch (status) {
      case "online":
        return "#4caf50"; // Xanh lá
      case "offline":
        return "#f44336"; // Đỏ
      default:
        return "#ff9800"; // Cam (Loading)
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "online":
        return "Hệ thống ổn định";
      case "offline":
        return "Mất kết nối";
      default:
        return "Đang kiểm tra...";
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 15px",
        marginTop: "auto", // Đẩy xuống dưới cùng nếu container cha là flex column
        marginBottom: "10px",
        fontSize: "12px",
        color: "#666",
        background: "#f9f9f9",
        borderRadius: "8px",
        border: "1px solid #eee",
      }}
    >
      <span
        style={{
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          backgroundColor: getStatusColor(),
          display: "inline-block",
          boxShadow: `0 0 5px ${getStatusColor()}`,
        }}
      ></span>
      <span>{getStatusText()}</span>
    </div>
  );
};

export default SystemStatus;
