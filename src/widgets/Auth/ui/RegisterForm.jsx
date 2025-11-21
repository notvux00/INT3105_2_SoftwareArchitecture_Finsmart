import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuthFeature } from "../../../features/authentication/model/useAuth";
import "../../../frontend/pages/RegisterPage.css"; // CSS cũ

const RegisterForm = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthFeature();
  const [formData, setFormData] = useState({
    fullName: "",
    dob: "",
    email: "",
    phone: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    register(formData);
  };

  return (
    <div className="register-page-card">
      <div className="register-page-container">
        <form className="register-form" onSubmit={handleSubmit}>
          <div className="input-row">
            <div className="input-group">
              <label>Họ Và Tên</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div className="input-group">
              <label>Ngày Sinh</label>
              <input
                type="text"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                placeholder="DD/MM/YYYY"
                required
              />
            </div>
          </div>

          <div className="input-row">
            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="input-group">
              <label>SĐT</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Tên Đăng Nhập</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Mật Khẩu</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <span
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          <div className="input-group">
            <label>Xác Nhận Mật Khẩu</label>
            <div className="password-wrapper">
              <input
                type={showConfirm ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <span
                className="password-toggle"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="register-button"
            disabled={isLoading}
          >
            {isLoading ? "Đang xử lý..." : "Đăng Ký"}
          </button>
          <button
            type="button"
            className="back-button"
            onClick={() => navigate("/")}
          >
            Quay Lại
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
