import React, { useState } from "react";
import "./LoginPage.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import supabase from "../../database/supabase";
import bcrypt from "bcryptjs";
import CryptoJS from "crypto-js";

const SECRET_KEY = process.env.REACT_APP_SECRET_KEY;
const SUPABASE_PROJECT_URL = 'https://nvbdupcoynrzkrwyhrjc.supabase.co';

function LoginPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

const handleLogin = (e) => {
  e.preventDefault();    
  async function signIn(username, password) {
      // 1. Xác định URL của Edge Function (Đã deploy)
      const EDGE_URL = `${SUPABASE_PROJECT_URL}/functions/v1/login-limiting`;

      // 2. Gửi yêu cầu đăng nhập đến Edge Function (Server-Side)
      const response = await fetch(EDGE_URL, {
          method: 'POST',
          headers: {
             'Content-Type': 'application/json',
             'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
             },
          body: JSON.stringify({ username, password }),
      });
      
      const result = await response.json();

      // 3. Xử lý Lỗi từ Edge Function (429 Rate Limit hoặc 401 Xác thực)
      if (response.status !== 200) {
          alert(result.error); 
          return;
      }

      // 4. ĐĂNG NHẬP THÀNH CÔNG (Edge Function trả về user_id KHÔNG mã hóa)
      console.log(`Đăng nhập thành công! Xin chào, ${username}`);
      alert(`Đăng nhập thành công! Xin chào, ${username}`);

      // 5. MÃ HÓA user_id và LƯU vào localStorage vẫn giữ nguyên ko dựng jwt
      const encryptedUserId = CryptoJS.AES.encrypt(
          result.user_id.toString(), // Lấy user_id KHÔNG mã hóa từ Edge Function
          SECRET_KEY
      ).toString();
      localStorage.setItem("user_id", encryptedUserId); 

      // 6. Điều hướng
      navigate("/home");
      setTimeout(() => window.location.reload(), 100); 
  }
  signIn(username, password);
};

  return (
    <div className="login-page-card">
      <div className="login-page-container">
        <form className="login-form" onSubmit={handleLogin}>
          {/* Tài Khoản/Email */}
          <div className="input-group">
            <label>Tài Khoản</label>
            <input
              data-testid="input-account"
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Nhập tài khoản của bạn"
            />
          </div>

          {/* Mật Khẩu (có icon mắt) */}
          <div className="input-group">
            <label htmlFor="password">Mật Khẩu</label>
            <div className="password-wrapper">
              <input
                data-testid="input-password"
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Nhập mật khẩu của bạn"
              />
              <span className="password-toggle" onClick={handleTogglePassword}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          {/* Nút Đăng Nhập */}
          <button type="submit" data-testid="login-button" className="login-button">
            Đăng Nhập
          </button>

          {/* Nút Đăng Ký */}
          <button
            type="button"
            className="goback-button"
            onClick={() => navigate("/")}
          >
            Quay Lại
          </button>

          {/* Link Quên Mật Khẩu */}
          <p className="forgot-password">Quên Mật Khẩu</p>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
