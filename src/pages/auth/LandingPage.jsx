import React from "react";
import { useNavigate } from "react-router-dom";
import "../../frontend/pages/LandingPage.css"; // Tạm dùng CSS cũ

const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="icon">
          <img src="Soucre/Logo.png" alt="Logo" className="login-logo" />
          <h1 className="app-name">FIN SMART</h1>
        </div>

        <button className="login-button btn" onClick={() => navigate("/login")}>
          Đăng Nhập
        </button>
        <button
          className="register-button btn"
          onClick={() => navigate("/register")}
        >
          Đăng Ký
        </button>
        {/* Logic Forgot Password chưa hoàn thiện nên tạm thời redirect về Home hoặc để trống */}
        <p
          className="forgot-password"
          onClick={() => navigate("/forgot-password")}
        >
          Quên Mật Khẩu
        </p>
      </div>
    </div>
  );
};

export default LandingPage;
