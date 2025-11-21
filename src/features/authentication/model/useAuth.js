import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CryptoJS from "crypto-js";
import { authAPI } from "../api/authAPI";
import { SECRET_KEY } from "../../../shared/config";

export const useAuthFeature = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async ({ username, password }) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await authAPI.login({ username, password });

      console.log(`Đăng nhập thành công! Xin chào, ${username}`);
      alert(`Đăng nhập thành công! Xin chào, ${username}`);

      // Mã hóa và lưu user_id
      const encryptedUserId = CryptoJS.AES.encrypt(
        result.user_id.toString(),
        SECRET_KEY
      ).toString();
      localStorage.setItem("user_id", encryptedUserId);

      navigate("/home");
      // Reload nhẹ để cập nhật state toàn app (theo code cũ)
      setTimeout(() => window.location.reload(), 100);
    } catch (err) {
      alert(err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    setIsLoading(true);
    setError(null);
    try {
      if (userData.password !== userData.confirmPassword) {
        throw new Error("Mật khẩu xác nhận không khớp!");
      }

      await authAPI.register(userData);

      alert("✅ Đăng ký thành công!");
      navigate("/login");
      setTimeout(() => window.location.reload(), 100);
    } catch (err) {
      alert(err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    register,
    isLoading,
    error,
  };
};
