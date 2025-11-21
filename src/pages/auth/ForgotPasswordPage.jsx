import React from "react";
import { useNavigate } from "react-router-dom";
import "../../frontend/pages/ForgotPasswordPage.css"; // CSS cũ

const ForgotPasswordPage = () => {
  const navigate = useNavigate();

  const handleForgotPassword = (e) => {
    e.preventDefault();
    console.log(
      "Gửi yêu cầu khôi phục mật khẩu... (Tính năng đang phát triển)"
    );
    alert("Tính năng đang phát triển!");
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Quên Mật Khẩu</h2>
        <form onSubmit={handleForgotPassword}>
          <div className="input-group">
            <label>Email</label>
            <input type="email" placeholder="nhập email của bạn" required />
          </div>
          <button type="submit" className="login-button btn">
            Gửi Yêu Cầu
          </button>
        </form>
        <p
          onClick={() => navigate("/login")}
          style={{ cursor: "pointer", marginTop: "10px" }}
        >
          Quay lại đăng nhập
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
