import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuthFeature } from "../../../features/authentication/model/useAuth"; // Hook mới
import "../../../frontend/pages/LoginPage.css"; // CSS cũ

const LoginForm = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthFeature();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    login({ username, password });
  };

  return (
    <div className="login-page-card">
      <div className="login-page-container">
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Tài Khoản</label>
            <input
              data-testid="input-account"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Nhập tài khoản của bạn"
            />
          </div>

          <div className="input-group">
            <label>Mật Khẩu</label>
            <div className="password-wrapper">
              <input
                data-testid="input-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Nhập mật khẩu của bạn"
              />
              <span
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          <button
            type="submit"
            data-testid="login-button"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? "Đang xử lý..." : "Đăng Nhập"}
          </button>

          <button
            type="button"
            className="goback-button"
            onClick={() => navigate("/")}
          >
            Quay Lại
          </button>

          <p
            className="forgot-password"
            onClick={() => navigate("/forgot-password")}
          >
            Quên Mật Khẩu
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
