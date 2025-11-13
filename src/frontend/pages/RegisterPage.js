import React, { useState } from "react";
import "./RegisterPage.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import supabase from "../../database/supabase";
import bcrypt from "bcryptjs";


const SUPABASE_PROJECT_URL = 'https://nvbdupcoynrzkrwyhrjc.supabase.co';
const EDGE_URL = `${SUPABASE_PROJECT_URL}/functions/v1/register-limiting`;

function RegisterPage() {
  const navigate = useNavigate();
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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const createWallet = async (username) => {
    const { data, err } = await supabase
        .from("users")
        .select("user_id")
        .eq("user_name", username)
        .single();

      if (err || !data) {
        alert("Sai tài khoản hoặc mật khẩu!");
        return;
      }
      const userId = data.user_id;
    const { error } = await supabase.from("wallets").insert([
      {
        user_id: userId,
        wallet_name: "Ví chính",
        balance: 0,
      },
    ]);

    if (error) {
      console.error("Error creating wallet:", error);
    } 
  };

  async function handleSignUp(email, password, username, fullName, dob, phone) {

    //fetch đến edge function
    const response = await fetch(EDGE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
            },
        body: JSON.stringify({ email, password, username, fullName, dob, phone }),
    });
    
    const result = await response.json();

    // 3. lỗi từ edge function
    if (response.status !== 200) {
        alert(result.error); 
        return;
    }
  
    alert("bú, đã đăng ký thành công!");
    createWallet(username);
    navigate("/login");
    setTimeout(() => window.location.reload(), 100); 
  }
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleToggleConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
        alert("Mật khẩu xác nhận không khớp!");
        return;
    }

    await handleSignUp(
      formData.email,
      formData.password,
      formData.username,
      formData.fullName,
      formData.dob,
      formData.phone
    );
    console.log("Dữ liệu đăng ký:", formData);
  };

  return (
    <div className="register-page-card">
      <div className="register-page-container">
        <form className="register-form" onSubmit={handleRegister}>
          {/* Họ và Tên - Ngày Sinh */}
          <div className="input-row">
            <div className="input-group">
              <label>Họ Và Tên</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="nguyen anh tuan"
                required
              />
            </div>
            <div className="input-group">
              <label>Date Of Birth</label>
              <input
                type="text"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                placeholder="DD / MM / YYYY"
                required
              />
            </div>
          </div>

          {/* Email - Số Điện Thoại */}
          <div className="input-row">
            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@example.com"
                required
              />
            </div>
            <div className="input-group">
              <label>Mobile Number</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+ 123 456 789"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>User Name</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          {/* Mật Khẩu */}
          <div className="input-group">
            <label>Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <span className="password-toggle" onClick={handleTogglePassword}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          {/* Xác Nhận Mật Khẩu */}
          <div className="input-group">
            <label>Confirm Password</label>
            <div className="password-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <span
                className="password-toggle"
                onClick={handleToggleConfirmPassword}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          {/* Nút Đăng Ký và Quay Lại */}
          <button type="submit" className="register-button">
            Đăng Ký
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
}

export default RegisterPage;
